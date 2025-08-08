import type { IAI, AIResponse, ChatMessage, AskOptions, ChatOptions, ToolsRequest, ToolDefinition, AIProviderConfig } from '../types.js';
import { AIError } from '../types.js';

// OpenRouter API response types (same as OpenAI since it's compatible)
interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenRouterMessage {
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

interface OpenRouterResponse {
  choices: Array<{
    message: OpenRouterMessage;
  }>;
  model: string;
  usage: OpenRouterUsage;
}

/**
 * OpenRouter Provider - Clean implementation of IAI interface
 * 
 * Pure provider following OpenAI API pattern with OpenRouter endpoint
 * Works with ToolDefinition[], not TeachingContract[]
 * 
 * @example
 * ```typescript
 * const openrouter = new OpenRouter({ 
 *   apiKey: 'sk-or-...', 
 *   model: 'openai/gpt-oss-20b' 
 * });
 * 
 * const response = await openrouter.ask('What is 2+2?');
 * ```
 */
export class OpenRouter implements IAI {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseURL: string;

  constructor(config: AIProviderConfig & { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'openai/gpt-oss-20b';
    this.baseURL = config.baseURL || 'https://openrouter.ai/api/v1';
  }

  async ask(prompt: string, options?: AskOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://synet.ai', // Required by OpenRouter
          'X-Title': 'SYNET AI Unit' // Optional, helps with analytics
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 1000,
          stop: options?.stopSequences
        })
      });

      if (!response.ok) {
        throw new AIError(`OpenRouter API error: ${response.status} ${response.statusText}`, 'openrouter');
      }

      const data = await response.json() as OpenRouterResponse;
      
      return {
        content: data.choices[0]?.message?.content || '',
        provider: 'openrouter',
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens
        },
        metadata: options?.metadata
      };
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(`OpenRouter ask failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'openrouter');
    }
  }

  async tools(toolDefinitions: ToolDefinition[], request: ToolsRequest): Promise<AIResponse> {
    try {
      const messages = [];
      
      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      
      if (request.prompt) {
        messages.push({ role: 'user', content: request.prompt });
      }

      const requestBody = {
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://synet.ai', // Required by OpenRouter
          'X-Title': 'SYNET AI Unit' // Optional, helps with analytics
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIError(`OpenRouter API error: ${response.status} ${response.statusText}`, 'openrouter');
      }

      const data = await response.json() as OpenRouterResponse;
      const message = data.choices[0]?.message;
      
      const result: AIResponse = {
        content: message?.content || '',
        provider: 'openrouter',
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens
        },
        metadata: request.metadata
      };

      // Convert tool calls to our format
      if (message?.tool_calls) {
        result.toolCalls = message.tool_calls.map(call => ({
          id: call.id,
          type: 'function' as const,
          function: {
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments)
          }
        }));
      }

      return result;
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(`OpenRouter tools failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'openrouter');
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://synet.ai', // Required by OpenRouter
          'X-Title': 'SYNET AI Unit' // Optional, helps with analytics
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 1000,
          stop: options?.stopSequences
        })
      });

      if (!response.ok) {
        throw new AIError(`OpenRouter API error: ${response.status} ${response.statusText}`, 'openrouter');
      }

      const data = await response.json() as OpenRouterResponse;
      
      return {
        content: data.choices[0]?.message?.content || '',
        provider: 'openrouter',
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens
        },
        metadata: options?.metadata
      };
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(`OpenRouter chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'openrouter');
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.ask('Test connection', { maxTokens: 1 });
      return response.content !== undefined;
    } catch {
      return false;
    }
  }
}
