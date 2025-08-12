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

// DeepSeek uses OpenAI-compatible API format
interface DeepSeekUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface DeepSeekMessage {
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

interface DeepSeekResponse {
  choices: Array<{
    message: DeepSeekMessage;
  }>;
  model: string;
  usage: DeepSeekUsage;
}

/**
 * DeepSeek Provider - OpenAI-compatible API
 *
 * DeepSeek uses the exact same API format as OpenAI, just different endpoint and models
 *
 * @example
 * ```typescript
 * const deepseek = new DeepSeek({
 *   apiKey: 'sk-...',
 *   model: 'deepseek-chat'
 * });
 *
 * const response = await deepseek.ask('What is 2+2?');
 * ```
 */
export class DeepSeek implements IAI {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseURL: string;

  constructor(config: AIProviderConfig & { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || "deepseek-chat";
    this.baseURL = config.baseURL || "https://api.deepseek.com/v1";
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
          `DeepSeek API error: ${response.status} ${response.statusText}`,
          "deepseek",
        );
      }

      const data = (await response.json()) as DeepSeekResponse;

      return {
        content: data.choices[0]?.message?.content || "",
        provider: "deepseek",
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
        `DeepSeek ask failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "deepseek",
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
          `DeepSeek API error: ${response.status} ${response.statusText}`,
          "deepseek",
        );
      }

      const data = (await response.json()) as DeepSeekResponse;
      const message = data.choices[0]?.message;

      const result: AIResponse = {
        content: message?.content || "",
        provider: "deepseek",
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
        `DeepSeek tools failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "deepseek",
      );
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<AIResponse> {
    try {
      const deepseekMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      if (options?.systemPrompt) {
        deepseekMessages.unshift({
          role: "system",
          content: options.systemPrompt,
        });
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          messages: deepseekMessages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 1000,
          stop: options?.stopSequences,
        }),
      });

      if (!response.ok) {
        throw new AIError(
          `DeepSeek API error: ${response.status} ${response.statusText}`,
          "deepseek",
        );
      }

      const data = (await response.json()) as DeepSeekResponse;

      return {
        content: data.choices[0]?.message?.content || "",
        provider: "deepseek",
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
        `DeepSeek chat failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "deepseek",
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
