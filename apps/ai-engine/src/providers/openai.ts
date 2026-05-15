import OpenAI from "openai";
import { logger } from "../utils/logger";
import { BaseAIProvider, ChatMessage, AIResponse } from "./base";

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(messages: ChatMessage[], options: any = {}): Promise<AIResponse> {
    try {
      let client = this.client;
      
      // Use custom key or base URL if provided
      if (options.apiKey || options.baseUrl) {
        client = new OpenAI({
          apiKey: options.apiKey || process.env.OPENAI_API_KEY,
          baseURL: options.baseUrl || undefined,
        });
      }

      const response = await client.chat.completions.create({
        model: options.model || "gpt-4",
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || options.maxTokens || 2000,
      });

      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;

      return {
        content: response.choices[0].message.content || "",
        tokens_used: response.usage?.total_tokens || 0,
        cost: this.calculateCost(promptTokens, completionTokens),
      };
    } catch (error) {
      logger.error("OpenAI error:", error);
      throw error;
    }
  }

  private calculateCost(promptTokens: number, completionTokens: number): number {
    // GPT-4 pricing approximation
    const promptCost = promptTokens * 0.00003;
    const completionCost = completionTokens * 0.00006;
    return promptCost + completionCost;
  }
}
