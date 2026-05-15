import axios from "axios";
import { BaseAIProvider, ChatMessage, AIResponse } from "./base";
import { logger } from "../utils/logger";

export class OllamaProvider extends BaseAIProvider {
  private baseURL: string;

  constructor() {
    super();
    this.baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  }

  async chat(messages: ChatMessage[], options: any = {}): Promise<AIResponse> {
    try {
      const baseURL = options.baseUrl || this.baseURL;
      
      // Ollama /api/chat supports messages array
      const response = await axios.post(`${baseURL}/api/chat`, {
        model: options.model || "llama3",
        messages: messages,
        stream: false,
        options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 2000,
        }
      });

      return {
        content: response.data.message.content,
        tokens_used: 0, // Ollama doesn't always provide this clearly in /api/chat response without more parsing
        cost: 0,
      };
    } catch (error) {
      logger.error("Ollama error:", error);
      throw error;
    }
  }
}
