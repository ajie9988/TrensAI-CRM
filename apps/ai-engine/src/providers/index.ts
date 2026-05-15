import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { OllamaProvider } from "./ollama";
import { BaseAIProvider } from "./base";

export type ProviderType = "openai" | "anthropic" | "gemini" | "ollama";

export class AI {
  private static providers: Map<string, BaseAIProvider> = new Map();

  static provider(type: ProviderType): BaseAIProvider {
    if (this.providers.has(type)) {
      return this.providers.get(type)!;
    }

    let provider: BaseAIProvider;

    switch (type) {
      case "openai":
        provider = new OpenAIProvider();
        break;
      case "anthropic":
        provider = new AnthropicProvider();
        break;
      case "gemini":
        provider = new GeminiProvider();
        break;
      case "ollama":
        provider = new OllamaProvider();
        break;
      default:
        throw new Error(`Unsupported provider: ${type}`);
    }

    this.providers.set(type, provider);
    return provider;
  }
}
