import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { AIService } from "./services/ai.service";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "ai-engine" });
});

// Main AI Chat / Auto-reply
app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, messages, provider, model, context, knowledgeBase, tenant_id, options } = req.body;
    
    if (!provider && !tenant_id) {
      return res.status(400).json({ error: "provider or tenant_id is required" });
    }

    const ai = require("./providers").AI.provider(provider);
    
    // If messages array is provided (from Laravel), use it directly
    if (messages && Array.isArray(messages)) {
      let chatOptions: any = { ...options, model };
      
      // Use config from request body if provided, otherwise fetch from backend
      const config = req.body.config || (tenant_id ? await AIService.getTenantConfig(tenant_id) : null);
      
      if (config) {
        chatOptions.temperature = config.temperature;
        chatOptions.maxTokens = config.max_output_tokens;
        chatOptions.max_tokens = config.max_output_tokens; // support both
        chatOptions.apiKey = config.api_key;
        chatOptions.baseUrl = config.base_url;
        if (!model) chatOptions.model = config.ai_model;
      }

      const response = await ai.chat(messages, chatOptions);
      return res.json({
        content: response.content,
        usage: {
          total_tokens: response.tokens_used || 0,
          cost: response.cost || 0
        }
      });
    }

    // Otherwise use simple auto-reply logic
    if (!message) {
      return res.status(400).json({ error: "message or messages array is required" });
    }

    const response = await AIService.generateAutoReply(message, {
      tenantId: tenant_id,
      provider,
      model,
      context,
      knowledgeBase,
      ...options
    });

    res.json({
      content: response.content,
      usage: {
        total_tokens: response.tokens_used || 0,
        cost: response.cost || 0
      }
    });
  } catch (error: any) {
    logger.error("AI Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Intent Detection
app.post("/detect-intent", async (req: Request, res: Response) => {
  try {
    const { message, provider } = req.body;
    const result = await AIService.detectIntent(message, provider);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Summarization
app.post("/summarize", async (req: Request, res: Response) => {
  try {
    const { messages, provider } = req.body;
    const result = await AIService.summarizeConversation(messages, provider);
    res.json({ summary: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  logger.info(`AI Engine listening on port ${PORT}`);
});
