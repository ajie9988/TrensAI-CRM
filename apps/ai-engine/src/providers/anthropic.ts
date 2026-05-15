import Anthropic from "@anthropic-ai/sdk";
import { BaseAIProvider, ChatMessage, AIResponse } from "./base";
import { logger } from "../utils/logger";

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic;

  constructor() {
    super();
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }

  async chat(messages: ChatMessage[], options: any = {}): Promise<AIResponse> {
    try {
      let client = this.client;
      
      if (options.apiKey) {
        client = new Anthropic({
          apiKey: options.apiKey,
        });
      }

      // Anthropic requires alternating roles and starts with user. 
      // System message is separate in Claude 3 API.
      const systemMessage = messages.find(m => m.role === "system")?.content;
      const chatMessages = messages.filter(m => m.role !== "system").map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));

      const response = await client.messages.create({
        model: options.model || "claude-3-haiku-20240307",
        max_tokens: options.maxTokens || 2000,
        system: systemMessage,
        messages: chatMessages,
        temperature: options.temperature || 0.7,
      });

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;

      return {
        content: response.content[0].type === "text" ? response.content[0].text : "",
        tokens_used: inputTokens + outputTokens,
        cost: this.calculateCost(inputTokens, outputTokens),
      };
    } catch (error) {
      logger.error("Anthropic error:", error);
      throw error;
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Claude 3 Haiku pricing approximation
    const inputCost = inputTokens * 0.00000025;
    const outputCost = outputTokens * 0.00000125;
    return inputCost + outputCost;
  }
}
