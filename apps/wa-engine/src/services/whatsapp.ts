import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  proto,
  fetchLatestBaileysVersion,
  Browsers,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import axios from "axios";
import path from "path";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { createRedisClient } from "./redis";
import { logger } from "../utils/logger";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const API_KEY = process.env.API_KEY || "";

// Map of deviceId → socket instance
const sessions = new Map<string, any>();
const connectionState = new Map<string, boolean>();
const sessionWasOpen = new Map<string, boolean>();
const qrCache = new Map<string, string>();
const pairingCodeCache = new Map<string, string>();
const pairingCodeInFlight = new Set<string>();
const stoppingSessions = new Set<string>();

const getSessionDir = (deviceId: string) => path.join(process.cwd(), "sessions", deviceId);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getRedis() {
  try {
    return await createRedisClient();
  } catch {
    return null;
  }
}

/** Start a WhatsApp session for a given device */
async function preparePairingCode(deviceId: string, sock: any, phoneNumber: string): Promise<void> {
  if (pairingCodeInFlight.has(deviceId) || pairingCodeCache.has(deviceId)) {
    return;
  }

  pairingCodeInFlight.add(deviceId);

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (sock.authState?.creds?.registered) {
        return;
      }

      try {
        const pairingCode = await sock.requestPairingCode(phoneNumber);
        if (pairingCode) {
          pairingCodeCache.set(deviceId, pairingCode);
          logger.info(`[WA] Pairing code ready for device ${deviceId}`);
          return;
        }
      } catch {
        logger.warn(`[WA] Pairing code attempt ${attempt + 1} failed for device ${deviceId}`);
      }

      await delay(1200);
    }
  } finally {
    pairingCodeInFlight.delete(deviceId);
  }
}

export async function startSession(deviceId: string, pairingPhoneNumber?: string): Promise<void> {
  if (sessions.has(deviceId)) {
    logger.info(`[WA] Session ${deviceId} already running`);
    return;
  }

  const sessionDir = getSessionDir(deviceId);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ deviceId, version, isLatest }, "[WA] Using WA Web version");

  const sock = makeWASocket({
    auth: state,
    version,
    browser: Browsers.windows("Desktop"),
    syncFullHistory: false,
    printQRInTerminal: false,
    logger: logger as any,
  });

  sessions.set(deviceId, sock);
  connectionState.set(deviceId, false);
  sessionWasOpen.set(deviceId, false);
  const redis = await getRedis();
  if (redis) {
    await redis.set(`wa:session:${deviceId}`, "1");
  }

  sock.ev.on("creds.update", saveCreds);

  if (pairingPhoneNumber) {
    void preparePairingCode(deviceId, sock, pairingPhoneNumber);
  }

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    const redis = await getRedis();

    if (qr) {
      logger.info(`[WA] QR ready for device ${deviceId}`);
      qrCache.set(deviceId, qr);
      pairingCodeCache.delete(deviceId);
      if (redis) {
        await redis.set(`wa:qr:${deviceId}`, qr, { EX: 60 });
      }
      await notifyBackend("device.qr", { device_id: deviceId, qr });
    }

    if (connection === "open") {
      logger.info(`[WA] Device ${deviceId} connected`);
      connectionState.set(deviceId, true);
      sessionWasOpen.set(deviceId, true);
      qrCache.delete(deviceId);
      pairingCodeCache.delete(deviceId);
      if (redis) {
        await redis.del(`wa:qr:${deviceId}`);
      }
      await notifyBackend("device.connected", {
        device_id: deviceId,
        phone_number: (sock as any).user?.id?.split(":")[0],
        status: "connected",
      });
    }

    if (connection === "close") {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      logger.warn(`[WA] Device ${deviceId} disconnected — reason ${reason}`);

      sessions.delete(deviceId);
      connectionState.set(deviceId, false);

      if (stoppingSessions.has(deviceId)) {
        stoppingSessions.delete(deviceId);
        qrCache.delete(deviceId);
        pairingCodeCache.delete(deviceId);
        pairingCodeInFlight.delete(deviceId);
        if (redis) {
          await redis.del(`wa:session:${deviceId}`);
          await redis.del(`wa:qr:${deviceId}`);
        }
        await notifyBackend("device.disconnected", {
          device_id: deviceId,
          status: "disconnected",
        });
        return;
      }

      const wasOpen = sessionWasOpen.get(deviceId) === true;
      const shouldReconnect =
        reason !== DisconnectReason.loggedOut &&
        (reason !== DisconnectReason.timedOut || wasOpen);

      if (!shouldReconnect && !wasOpen) {
        sessionWasOpen.delete(deviceId);
      }

      await notifyBackend("device.disconnected", {
        device_id: deviceId,
        status: shouldReconnect ? "connecting" : "disconnected",
      });

      if (shouldReconnect) {
        logger.info(`[WA] Reconnecting device ${deviceId}...`);
        setTimeout(() => startSession(deviceId, pairingPhoneNumber), 5000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.message) {
        await handleIncomingMessage(deviceId, msg);
      }
    }
  });
}

/** Stop a session */
export async function stopSession(deviceId: string): Promise<void> {
  const redis = await getRedis();
  const sock = sessions.get(deviceId);
  if (sock) {
    stoppingSessions.add(deviceId);
    await sock.logout();
    sessions.delete(deviceId);
    connectionState.set(deviceId, false);
    sessionWasOpen.delete(deviceId);
    qrCache.delete(deviceId);
    pairingCodeCache.delete(deviceId);
    pairingCodeInFlight.delete(deviceId);
    if (redis) {
      await redis.del(`wa:session:${deviceId}`);
      await redis.del(`wa:qr:${deviceId}`);
    }

    logger.info(`[WA] Session ${deviceId} stopped`);
  }

  connectionState.set(deviceId, false);
  sessionWasOpen.delete(deviceId);

  try {
    await fs.rm(getSessionDir(deviceId), { recursive: true, force: true });
  } catch (err) {
    logger.warn(`[WA] Failed to clear auth state for device ${deviceId}: ${err}`);
  }
}

/** Send a text message */
export async function sendMessage(
  deviceId: string,
  phone: string,
  text: string
): Promise<void> {
  const sock = sessions.get(deviceId);
  if (!sock) throw new Error(`Session ${deviceId} not found`);

  const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
  
  // Store mapping for LID resolution later
  if (jid.endsWith("@lid")) {
    const redis = await createRedisClient();
    if (redis) {
      await redis.set(`wa:lid_map:${jid}`, phone, { EX: 86400 * 30 });
      logger.info(`[WA] Mapped LID ${jid} to PN ${phone} from outgoing request`);
    }
  }

  await sock.sendMessage(jid, { text });
}

/** Send a media message */
export async function sendMedia(
  deviceId: string,
  phone: string,
  mediaUrl: string,
  caption: string,
  type: "image" | "video" | "audio" | "document",
  mimetype?: string,
  filename?: string
): Promise<void> {
  const sock = sessions.get(deviceId);
  if (!sock) throw new Error(`Session ${deviceId} not found`);

  const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
  
  // Store mapping for LID resolution later
  if (jid.endsWith("@lid")) {
    const redis = await createRedisClient();
    if (redis) {
      await redis.set(`wa:lid_map:${jid}`, phone, { EX: 86400 * 30 });
      logger.info(`[WA] Mapped LID ${jid} to PN ${phone} from outgoing media request`);
    }
  }

  let buffer: Buffer;

  // Optimized for monorepo/local dev: 
  // If URL is localhost, try to read file directly to avoid single-thread deadlock
  if (mediaUrl.includes("localhost") || mediaUrl.includes("127.0.0.1")) {
    try {
      const fileName = path.basename(mediaUrl);
      // Construct path to backend storage
      const localPath = path.join(process.cwd(), "..", "backend", "storage", "app", "public", "temp_media", fileName);
      buffer = await fs.readFile(localPath);
      logger.info(`[WA] Read media directly from disk: ${localPath}`);
    } catch (err) {
      logger.warn(`[WA] Failed to read local media, falling back to HTTP: ${err}`);
      const res = await axios.get(mediaUrl, { responseType: "arraybuffer" });
      buffer = Buffer.from(res.data);
    }
  } else {
    const res = await axios.get(mediaUrl, { responseType: "arraybuffer" });
    buffer = Buffer.from(res.data);
  }

  const payload: any = { [type]: buffer };
  if (caption) payload.caption = caption;
  if (mimetype) payload.mimetype = mimetype;
  if (filename) payload.fileName = filename;

  await sock.sendMessage(jid, payload);
}

/** Get QR for device */
export async function getQR(deviceId: string): Promise<string | null> {
  if (qrCache.has(deviceId)) {
    return qrCache.get(deviceId) ?? null;
  }

  const redis = await getRedis();
  if (!redis) {
    return null;
  }

  return redis.get(`wa:qr:${deviceId}`);
}

/** Get pairing code for a device */
export async function getPairingCode(deviceId: string, phoneNumber: string): Promise<string | null> {
  const cached = pairingCodeCache.get(deviceId);
  if (cached) {
    return cached;
  }

  let sock = sessions.get(deviceId);
  if (!sock) {
    await startSession(deviceId, phoneNumber);
    sock = sessions.get(deviceId);
  }

  if (!sock) {
    return null;
  }

  if (sock.authState?.creds?.registered) {
    return null;
  }

  void preparePairingCode(deviceId, sock, phoneNumber);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const refreshed = pairingCodeCache.get(deviceId);
    if (refreshed) {
      return refreshed;
    }

    await delay(1000);
  }

  return pairingCodeCache.get(deviceId) ?? null;
}

/** Check if session is active */
export function isConnected(deviceId: string): boolean {
  return connectionState.get(deviceId) === true;
}

/** Handle incoming WhatsApp message → forward to backend */
const MEDIA_PATH = path.join(process.cwd(), "public", "media");

async function downloadMedia(msg: proto.IWebMessageInfo, type: string): Promise<string | null> {
  try {
    const buffer = await downloadMediaMessage(msg, "buffer", {});
    const fileName = `${msg.key.id}.${type === "image" ? "jpg" : type === "video" ? "mp4" : "bin"}`;
    const filePath = path.join(MEDIA_PATH, fileName);

    await fs.mkdir(MEDIA_PATH, { recursive: true });
    await fs.writeFile(filePath, buffer as Buffer);

    return `${process.env.WA_ENGINE_URL || "http://localhost:3001"}/media/${fileName}`;
  } catch (err) {
    logger.error("Failed to download media:", err);
    return null;
  }
}

async function handleIncomingMessage(
  deviceId: string,
  msg: proto.IWebMessageInfo
): Promise<void> {
  try {
    const remoteJid = msg.key.remoteJid || "";
    const participant = msg.key.participant || "";
    
    // Get Redis client for LID mapping
    const redis = await createRedisClient();

    logger.info({ 
      remoteJid: msg.key.remoteJid, 
      participant: msg.key.participant,
      fromMe: msg.key.fromMe,
      senderPn: (msg.key as any).senderPn,
      allKeys: Object.keys(msg.key)
    }, "[WA] JID Debugging");

    // Determine the "real" phone number / conversation identifier
    // Prioritize PN (Phone Number) fields provided by WhatsApp in msg.key
    let phone_number = remoteJid;
    const key = msg.key as any;
    const resolvedPn = key.participantPn || key.senderPn;

    if (!remoteJid.endsWith('@g.us')) {
      if (resolvedPn) {
        phone_number = resolvedPn;
        // Also update/refresh mapping in Redis if remoteJid is an LID
        if (remoteJid.endsWith('@lid') && redis) {
          await redis.set(`wa:lid_map:${remoteJid}`, resolvedPn, { EX: 86400 * 30 });
        }
      } else {
        // Fallback to Redis mapping if PN fields are not present (common for some fromMe messages)
        if (remoteJid.endsWith('@lid') && redis) {
          const mappedPn = await redis.get(`wa:lid_map:${remoteJid}`);
          if (mappedPn) {
            phone_number = mappedPn;
            logger.info(`[WA] Resolved LID ${remoteJid} to cached PN ${phone_number}`);
          }
        } else if (remoteJid.endsWith('@lid') && participant) {
          // Last resort fallback
          phone_number = participant;
        }
      }
    }

    // Determine JID for logging (optional, but good for debug)
    const resolvedJid = phone_number;
    
    // Clean phone number: ONLY for 1:1 chats, remove suffix. 
    // Keep @g.us for groups!
    let clean_phone = phone_number;
    if (!phone_number.endsWith('@g.us')) {
        clean_phone = phone_number.split('@')[0].split(':')[0];
    }

    logger.debug({ deviceId, remoteJid, participant, resolvedPhone: clean_phone }, "[WA] Incoming message JID resolution");

    // Robust message type & content detection
    const m = msg.message;
    const messageContent = m?.ephemeralMessage?.message || m?.viewOnceMessage?.message || m?.viewOnceMessageV2?.message || m;
    
    if (!messageContent) return;

    let content = "";
    let type = "text";
    let mediaUrl: string | null = null;

    if (messageContent.conversation) {
      content = messageContent.conversation;
      type = "text";
    } else if (messageContent.extendedTextMessage) {
      content = messageContent.extendedTextMessage.text || "";
      type = "text";
    } else if (messageContent.imageMessage) {
      content = messageContent.imageMessage.caption || "";
      type = "image";
      mediaUrl = await downloadMedia(msg, "image");
    } else if (messageContent.videoMessage) {
      content = messageContent.videoMessage.caption || "[Video]";
      type = "video";
      mediaUrl = await downloadMedia(msg, "video");
    } else if (messageContent.audioMessage) {
      content = "[Audio]";
      type = "audio";
      mediaUrl = await downloadMedia(msg, "audio");
    } else if (messageContent.documentMessage) {
      content = messageContent.documentMessage.title || "[Document]";
      type = "document";
      mediaUrl = await downloadMedia(msg, "document");
    } else if (messageContent.stickerMessage) {
      type = "sticker";
      mediaUrl = await downloadMedia(msg, "sticker");
    }

    const payload = {
      device_id: deviceId,
      phone_number: clean_phone,
      message_id: msg.key.id,
      content,
      type,
      media: mediaUrl ? { url: mediaUrl } : null,
      direction: msg.key.fromMe ? "outgoing" : "incoming",
      timestamp: Number(msg.messageTimestamp) * 1000,
    };

    logger.info({ 
      deviceId, 
      phone_number: payload.phone_number, 
      direction: payload.direction,
      message_id: payload.message_id
    }, "[WA] Sending payload to backend");

    await axios.post(`${BACKEND_URL}/api/v1/webhooks/whatsapp`, payload, {
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      timeout: 5000,
    });
  } catch (err) {
    logger.error(`[WA] Failed to forward message to backend: ${err}`);
  }
}

/** Notify backend of a device event */
async function notifyBackend(event: string, data: object): Promise<void> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/webhooks/whatsapp`,
        { event, ...data },
        {
          headers: { "X-API-Key": API_KEY },
          timeout: 3000,
        }
      );
      return;
    } catch (error: any) {
      lastError = error;
      await delay(400 * attempt);
    }
  }

  const errorMessage = axios.isAxiosError(lastError)
    ? `${lastError.response?.status ?? "no-response"} ${lastError.message}`
    : String(lastError);

  logger.warn(`[WA] Could not notify backend for event: ${event} (${errorMessage})`);
}
