import { AI, ProviderType } from "../providers";
import { ChatMessage } from "../providers/base";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export interface AutoReplyOptions {
  tenantId?: number;
  config?: any;
  provider: ProviderType;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  context?: ChatMessage[];
  knowledgeBase?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  static async getTenantConfig(tenantId: number) {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api/v1";
    try {
      const response = await axios.get(`${backendUrl}/tenant-ai-config/${tenantId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch config for tenant ${tenantId}:`, error);
      return null;
    }
  }

  static async generateAutoReply(message: string, options: AutoReplyOptions) {
    let systemInstruction = "You are a helpful CRM assistant.";
    let temperature = 0.7;
    let maxTokens = 2000;
    let provider = options.provider;
    let model = options.model;

    // Use provided config or fetch if tenantId is present
    const config = options.config || (options.tenantId ? await this.getTenantConfig(options.tenantId) : null);
    
    if (config) {
      systemInstruction = config.system_instruction || systemInstruction;
      temperature = config.temperature ?? temperature;
      maxTokens = config.max_output_tokens ?? maxTokens;
      provider = config.ai_provider as ProviderType || provider;
      model = config.ai_model || model;
      options.apiKey = config.api_key;
      options.baseUrl = config.base_url;
    }

    const ai = AI.provider(provider);
    
    const messages: ChatMessage[] = [
      { 
        role: "system", 
        content: `${systemInstruction} 
        ${options.knowledgeBase ? `Use this knowledge base to answer: ${options.knowledgeBase}` : ""}
        Keep your answers concise and professional.`
      }
    ];

    // Add memory context if available
    if (options.context) {
      messages.push(...options.context);
    }

    // Add current message
    messages.push({ role: "user", content: message });

    return await ai.chat(messages, { 
      model: model,
      temperature: temperature,
      maxTokens: maxTokens,
      apiKey: options.apiKey,
      baseUrl: options.baseUrl
    });
  }

  static async summarizeConversation(messages: ChatMessage[], provider: ProviderType) {
    const ai = AI.provider(provider);
    const text = messages.map(m => `${m.role}: ${m.content}`).join("\n");
    return await ai.summarize(text);
  }

  static async detectIntent(message: string, provider: ProviderType) {
    const ai = AI.provider(provider);
    return await ai.detectIntent(message);
  }
}
