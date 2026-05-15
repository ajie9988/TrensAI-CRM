import axios from "axios";
import { BaseAIProvider, ChatMessage, AIResponse } from "./base";
import { logger } from "../utils/logger";

export class GeminiProvider extends BaseAIProvider {
  constructor() {
    super();
  }

  async chat(messages: ChatMessage[], options: any = {}): Promise<AIResponse> {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in .env file and no custom key provided");
    }

    // Read behavior config from options
    const systemInstruction = options.systemInstruction || null;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2000;
    const model = options.model || "gemini-1.5-flash"; // Default to a stable known model if none provided

    const apiVersionMap: Record<string, string> = {
      "gemini-1.5-flash": "v1",
      "gemini-1.5-pro": "v1",
      "gemini-2.0-flash": "v1beta",
      "gemini-2.0-flash-lite": "v1beta",
    };
    
    let lastError: any = null;
    const apiVersion = apiVersionMap[model] || "v1beta";
    const domain = options.baseUrl || "https://generativelanguage.googleapis.com";
    const url = `${domain}/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

    try {
        logger.info("--- GEMINI DEBUG START ---");
        logger.info(`Using Key: ${apiKey.substring(0, 8)}...`);
        logger.info(`Attempting Model: ${model}`);

        // Extract system message
        const systemMsg = messages.find(m => m.role === 'system');
        const otherMsgs = messages.filter(m => m.role !== 'system');

        // Ensure alternating roles
        const contents: any[] = [];
        let lastRole = "";

        for (const msg of otherMsgs) {
          let currentRole = msg.role === "assistant" ? "model" : "user";
          if (currentRole === lastRole) {
            if (contents.length > 0) {
              contents[contents.length - 1].parts[0].text += "\n" + (msg.content || "");
            }
            continue;
          }
          contents.push({
            role: currentRole,
            parts: [{ text: msg.content || "..." }]
          });
          lastRole = currentRole;
        }

        const payload: any = {
          contents: contents,
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
          }
        };


        // Use GEMINI_SYSTEM_INSTRUCTION from .env first, fallback to message-level system role
        const sysText = systemInstruction || systemMsg?.content;
        if (sysText) {
          if (apiVersion === "v1beta") {
            payload.system_instruction = { parts: [{ text: sysText }] };
          } else {
            contents.unshift({ role: "user", parts: [{ text: sysText }] });
          }
        }

        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' }
        });

        const candidate = response.data.candidates?.[0];
        if (!candidate || !candidate.content || !candidate.content.parts?.[0]?.text) {
          throw new Error("AI memberikan respon kosong atau diblokir.");
        }

        const text = candidate.content.parts[0].text;
        const usage = response.data.usageMetadata || {};

        logger.info(`Gemini Success with ${model}`);
        logger.info("--- GEMINI DEBUG END ---");

        return {
          content: text,
          tokens_used: usage.totalTokenCount || 0,
          cost: 0,
        };
      } catch (error: any) {
        const errorData = error.response?.data;
        const errorMsg = errorData?.error?.message || error.message;

        logger.error(`Gemini Error: ${errorMsg}`);
        logger.error("--- GEMINI DEBUG END ---");
        
        throw new Error(errorMsg);
      }
  }
}
