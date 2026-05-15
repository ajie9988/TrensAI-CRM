import "dotenv/config";
import express from "express";
import QRCode from "qrcode";
import { createRedisClient } from "./services/redis";
import {
  startSession,
  stopSession,
  sendMessage,
  sendMedia,
  getQR,
  getPairingCode,
  isConnected,
} from "./services/whatsapp";
import { logger } from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use("/media", express.static("public/media"));

app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path, query: req.query }, "WA Engine incoming request");
  const key = req.headers["x-api-key"];
  if (req.path === "/health") return next();
  if (key && key === process.env.API_KEY) return next();
  return res.status(401).json({ error: "Unauthorized" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.post("/sessions/:deviceId/start", async (req, res) => {
  logger.info({ deviceId: req.params.deviceId, phone_number: req.body?.phone_number }, "WA Engine start session request");
  try {
    await startSession(req.params.deviceId, req.body?.phone_number);
    res.json({ message: `Session ${req.params.deviceId} started` });
  } catch (err: any) {
    logger.error("Start session error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/sessions/:deviceId/stop", async (req, res) => {
  try {
    await stopSession(req.params.deviceId);
    res.json({ message: `Session ${req.params.deviceId} stopped` });
  } catch (err: any) {
    logger.error("Stop session error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/reconnect", async (req, res) => {
  try {
    const { device_id } = req.body;
    if (!device_id) {
      return res.status(400).json({ error: "device_id required" });
    }
    await stopSession(String(device_id));
    await startSession(String(device_id), req.body?.phone_number);
    return res.json({ message: `Reconnect initiated for device ${device_id}` });
  } catch (err: any) {
    logger.error("Reconnect error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/qr/:deviceId", async (req, res) => {
  logger.info({ deviceId: req.params.deviceId }, "WA Engine QR request");
  const qr = await getQR(req.params.deviceId);
  if (!qr) {
    logger.info({ deviceId: req.params.deviceId }, "WA engine QR not available");
    return res.status(404).json({ error: "QR not available" });
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(qr, { width: 320 });
    logger.info({ deviceId: req.params.deviceId, qr_length: qr.length }, "WA engine QR generated");
    return res.json({ qr: qrDataUrl });
  } catch (error) {
    logger.error("Failed to generate QR image", error);
    return res.status(500).json({ error: "QR generation failed" });
  }
});

app.get("/pairing-code/:deviceId", async (req, res) => {
  try {
    const phoneNumber = String(req.query.phone_number || "").trim();
    if (!phoneNumber) {
      return res.status(400).json({ error: "phone_number required" });
    }

    const pairingCode = await getPairingCode(req.params.deviceId, phoneNumber);
    if (!pairingCode) {
      return res.status(404).json({ error: "Pairing code not available" });
    }

    return res.json({ pairing_code: pairingCode });
  } catch (err: any) {
    logger.error("Pairing code error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/send-message", async (req, res) => {
  try {
    const { device_id, phone, message } = req.body;
    if (!device_id || !phone || !message) {
      return res.status(400).json({ error: "device_id, phone, message required" });
    }
    await sendMessage(String(device_id), phone, message);
    return res.json({ success: true });
  } catch (err: any) {
    logger.error("Send message error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/send-media", async (req, res) => {
  try {
    const { device_id, phone, media_url, caption, type = "image", mimetype, filename } = req.body;
    if (!device_id || !phone || !media_url) {
      return res.status(400).json({ error: "device_id, phone, media_url required" });
    }

    await sendMedia(
      String(device_id),
      phone,
      media_url,
      caption ?? "",
      type as "image" | "video" | "audio" | "document",
      mimetype,
      filename
    );

    return res.json({ success: true });
  } catch (err: any) {
    logger.error("Send media error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/status/:deviceId", (req, res) => {
  const connected = isConnected(req.params.deviceId);
  logger.info({ deviceId: req.params.deviceId, connected }, "WA Engine status check");
  return res.json({ connected });
});

app.listen(PORT, async () => {
  logger.info(`WhatsApp Engine running on port ${PORT}`);

  try {
    const redis = await createRedisClient();
    if (!redis) {
      logger.warn("Redis unavailable on startup; skipping session auto-start");
      return;
    }
    const keys = await redis.keys("wa:session:*");

    for (const key of keys) {
      const deviceId = key.replace("wa:session:", "");
      logger.info(`[WA] Auto-starting session ${deviceId}`);
      await startSession(deviceId).catch((e: any) => {
        logger.error(`Failed to auto-start ${deviceId}: ${e.message}`);
      });
    }
  } catch (err) {
    logger.warn("Could not auto-start sessions:", err);
  }
});
