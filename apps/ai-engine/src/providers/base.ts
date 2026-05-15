export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  tokens_used?: number;
  cost?: number;
}

export abstract class BaseAIProvider {
  abstract chat(messages: ChatMessage[], options?: any): Promise<AIResponse>;
  
  async summarize(text: string): Promise<string> {
    const res = await this.chat([
      { role: "system", content: "Summarize the following text concisely." },
      { role: "user", content: text }
    ]);
    return res.content;
  }

  async detectIntent(message: string): Promise<{ intent: string; confidence: number }> {
    const res = await this.chat([
      { 
        role: "system", 
        content: "You are an intent detection system. Analyze the user message and respond ONLY with a JSON object: {\"intent\": \"string\", \"confidence\": 0.0-1.0}" 
      },
      { role: "user", content: message }
    ]);
    try {
      return JSON.parse(res.content);
    } catch {
      return { intent: "unknown", confidence: 0 };
    }
  }
}
