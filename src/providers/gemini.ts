import type {
  IAI,
  AIResponse,
  ChatMessage,
  AskOptions,
  ChatOptions,
  ToolsRequest,
  ToolDefinition,
  AIProviderConfig,
} from "../types.js";
import { AIError } from "../types.js";

// Gemini API has its own unique format
interface GeminiUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

interface GeminiFunction {
  name: string;
  args: Record<string, unknown>;
}

interface GeminiFunctionCall {
  functionCall: GeminiFunction;
}

interface GeminiContent {
  parts: Array<{
    text?: string;
    functionCall?: GeminiFunction;
  }>;
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason?: string;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata: GeminiUsage;
}

// Gemini tool format
interface GeminiTool {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<
        string,
        {
          type: string;
          description: string;
          enum?: string[];
        }
      >;
      required?: string[];
    };
  }>;
}

/**
 * Gemini Provider - Google's AI with unique API format
 *
 * Gemini uses a different API structure than OpenAI-compatible providers
 * Requires conversion between formats for tool calling
 *
 * @example
 * ```typescript
 * const gemini = new Gemini({
 *   apiKey: 'AIza...',
 *   model: 'gemini-1.5-flash'
 * });
 *
 * const response = await gemini.ask('What is 2+2?');
 * ```
 */
export class Gemini implements IAI {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseURL: string;

  constructor(config: AIProviderConfig & { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || "gemini-1.5-flash";
    this.baseURL =
      config.baseURL || "https://generativelanguage.googleapis.com/v1beta";
  }

  async ask(prompt: string, options?: AskOptions): Promise<AIResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: options?.temperature || 0.7,
              maxOutputTokens: options?.maxTokens || 1000,
              stopSequences: options?.stopSequences,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIError(
          `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`,
          "gemini",
        );
      }

      const data = (await response.json()) as GeminiResponse;
      const candidate = data.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text || "";

      return {
        content,
        provider: "gemini",
        model: this.model,
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount,
          completion_tokens: data.usageMetadata?.candidatesTokenCount,
          total_tokens: data.usageMetadata?.totalTokenCount,
        },
        metadata: options?.metadata,
      };
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(
        `Gemini ask failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "gemini",
      );
    }
  }

  async tools(
    toolDefinitions: ToolDefinition[],
    request: ToolsRequest,
  ): Promise<AIResponse> {
    try {
      // Convert OpenAI-style tools to Gemini format
      const geminiTools: GeminiTool[] = [
        {
          functionDeclarations: toolDefinitions.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters,
          })),
        },
      ];

      const contents = [];

      if (request.prompt) {
        contents.push({
          parts: [{ text: request.prompt }],
        });
      }

      const requestBody = {
        contents,
        tools: geminiTools,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      };

      const response = await fetch(
        `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIError(
          `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`,
          "gemini",
        );
      }

      const data = (await response.json()) as GeminiResponse;
      const candidate = data.candidates?.[0];

      const result: AIResponse = {
        content: this.extractTextContent(candidate?.content),
        provider: "gemini",
        model: this.model,
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount,
          completion_tokens: data.usageMetadata?.candidatesTokenCount,
          total_tokens: data.usageMetadata?.totalTokenCount,
        },
        metadata: request.metadata,
      };

      // Convert Gemini function calls to our format
      const functionCalls = this.extractFunctionCalls(candidate?.content);
      if (functionCalls.length > 0) {
        result.toolCalls = functionCalls.map((call, index) => ({
          id: `call_${Date.now()}_${index}`, // Generate ID since Gemini doesn't provide one
          type: "function" as const,
          function: {
            name: call.name,
            arguments: call.args,
          },
        }));
      }

      return result;
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(
        `Gemini tools failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "gemini",
      );
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<AIResponse> {
    try {
      // Convert messages to Gemini format
      const contents = messages
        .filter((msg) => msg.role !== "system") // Gemini handles system differently
        .map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }));

      const response = await fetch(
        `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: options?.temperature || 0.7,
              maxOutputTokens: options?.maxTokens || 1000,
              stopSequences: options?.stopSequences,
            },
            systemInstruction: options?.systemPrompt
              ? {
                  parts: [{ text: options.systemPrompt }],
                }
              : undefined,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIError(
          `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`,
          "gemini",
        );
      }

      const data = (await response.json()) as GeminiResponse;
      const candidate = data.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text || "";

      return {
        content,
        provider: "gemini",
        model: this.model,
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount,
          completion_tokens: data.usageMetadata?.candidatesTokenCount,
          total_tokens: data.usageMetadata?.totalTokenCount,
        },
        metadata: options?.metadata,
      };
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(
        `Gemini chat failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "gemini",
      );
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models?key=${this.apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Helper methods for Gemini's unique format
  private extractTextContent(content?: GeminiContent): string {
    if (!content?.parts) return "";

    return content.parts
      .filter((part) => part.text)
      .map((part) => part.text)
      .join("");
  }

  private extractFunctionCalls(content?: GeminiContent): GeminiFunction[] {
    if (!content?.parts) return [];

    return content.parts
      .filter((part) => part.functionCall)
      .map((part) => part.functionCall as GeminiFunction)
      .filter(Boolean);
  }
}
