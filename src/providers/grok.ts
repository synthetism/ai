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

// Grok uses OpenAI-compatible API format
interface GrokUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GrokMessage {
  role: string;
  content: string;
  tool_calls?: Array<{
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface GrokResponse {
  choices: Array<{
    message: GrokMessage;
  }>;
  model: string;
  usage: GrokUsage;
}

/**
 * Grok Provider - OpenAI-compatible API with conversational tool calling
 *
 * Grok follows the Claude pattern - sequential/conversational tool execution
 * API format is OpenAI-compatible but behavior is more cautious
 *
 * @example
 * ```typescript
 * const grok = new Grok({
 *   apiKey: 'xai-...',
 *   model: 'grok-beta'
 * });
 *
 * const response = await grok.ask('What is 2+2?');
 * ```
 */
export class Grok implements IAI {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseURL: string;

  constructor(config: AIProviderConfig & { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || "grok-3-mini";
    this.baseURL = config.baseURL || "https://api.x.ai/v1";
  }

  async ask(prompt: string, options?: AskOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          messages: [{ role: "user", content: prompt }],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 1000,
          stop: options?.stopSequences,
        }),
      });

      if (!response.ok) {
        throw new AIError(
          `Grok API error: ${response.status} ${response.statusText}`,
          "grok",
        );
      }

      const data = (await response.json()) as GrokResponse;

      return {
        content: data.choices[0]?.message?.content || "",
        provider: "grok",
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens,
        },
        metadata: options?.metadata,
      };
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(
        `Grok ask failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "grok",
      );
    }
  }

  async tools(
    toolDefinitions: ToolDefinition[],
    request: ToolsRequest,
  ): Promise<AIResponse> {
    try {
      const messages = [];

      if (request.systemPrompt) {
        messages.push({ role: "system", content: request.systemPrompt });
      }

      if (request.prompt) {
        messages.push({ role: "user", content: request.prompt });
      }

      const requestBody = {
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIError(
          `Grok API error: ${response.status} ${response.statusText}`,
          "grok",
        );
      }

      const data = (await response.json()) as GrokResponse;
      const message = data.choices[0]?.message;

      const result: AIResponse = {
        content: message?.content || "",
        provider: "grok",
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens,
        },
        metadata: request.metadata,
      };

      // Convert tool calls to our format
      if (message?.tool_calls) {
        result.toolCalls = message.tool_calls.map((call) => ({
          id: call.id,
          type: "function" as const,
          function: {
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments),
          },
        }));
      }

      return result;
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(
        `Grok tools failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "grok",
      );
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<AIResponse> {
    try {
      const grokMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      if (options?.systemPrompt) {
        grokMessages.unshift({ role: "system", content: options.systemPrompt });
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          messages: grokMessages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 1000,
          stop: options?.stopSequences,
        }),
      });

      if (!response.ok) {
        throw new AIError(
          `Grok API error: ${response.status} ${response.statusText}`,
          "grok",
        );
      }

      const data = (await response.json()) as GrokResponse;

      return {
        content: data.choices[0]?.message?.content || "",
        provider: "grok",
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens,
        },
        metadata: options?.metadata,
      };
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(
        `Grok chat failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "grok",
      );
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
