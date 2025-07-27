import type { IAI, AIResponse, ChatMessage, AskOptions, ChatOptions, ToolsRequest, ToolDefinition, AIProviderConfig } from '../types.js';
import { AIError } from '../types.js';

// Anthropic API response types
interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface AnthropicContent {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContent[];
}

interface AnthropicResponse {
  content: AnthropicContent[];
  model: string;
  usage: AnthropicUsage;
  stop_reason: string;
}

// Anthropic tool format (different from OpenAI!)
interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * Claude Provider - Anthropic's tool format is different!
 * 
 * Key differences from OpenAI:
 * 1. Tools are flat objects, not nested under "function"
 * 2. Schema is "input_schema" not "parameters"  
 * 3. Tool calls are "tool_use" content blocks
 * 4. Different response structure entirely
 * 
 * @example
 * ```typescript
 * const claude = new Claude({ 
 *   apiKey: 'sk-ant-...', 
 *   model: 'claude-3-5-sonnet-20241022' 
 * });
 * 
 * const response = await claude.ask('What is 2+2?');
 * ```
 */
export class Claude implements IAI {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseURL: string;

  constructor(config: AIProviderConfig & { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-7-sonnet-20250219 ';
    this.baseURL = config.baseURL || 'https://api.anthropic.com/v1';
  }

  async ask(prompt: string, options?: AskOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new AIError(`Claude API error: ${response.status} ${response.statusText}`, 'claude');
      }

      const data = await response.json() as AnthropicResponse;
      
      return {
        content: this.extractTextContent(data.content),
        provider: 'claude',
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.input_tokens,
          completion_tokens: data.usage?.output_tokens,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        metadata: options?.metadata
      };
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(`Claude ask failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'claude');
    }
  }

  async tools(toolDefinitions: ToolDefinition[], request: ToolsRequest): Promise<AIResponse> {
    try {
      // Convert tools to Anthropic format
      const anthropicTools = this.convertToAnthropicTools(toolDefinitions);

      const requestBody = {
        model: this.model,
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          { role: 'user', content: request.prompt }
        ],
        tools: anthropicTools,
        system: request.systemPrompt
      };

      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIError(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`, 'claude');
      }

      const data = await response.json() as AnthropicResponse;
      
      const result: AIResponse = {
        content: this.extractTextContent(data.content),
        provider: 'claude',
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.input_tokens,
          completion_tokens: data.usage?.output_tokens,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        metadata: request.metadata
      };

      // Convert tool uses to our format
      const toolUses = data.content.filter((c): c is AnthropicToolUse => c.type === 'tool_use');
      
      if (toolUses.length > 0) {
        result.toolCalls = toolUses.map(toolUse => ({
          id: toolUse.id,
          type: 'function' as const,
          function: {
            name: toolUse.name,
            arguments: toolUse.input as Record<string, unknown>
          }
        }));
      }

      return result;
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(`Claude tools failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'claude');
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    try {
      const anthropicMessages: AnthropicMessage[] = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options?.model || this.model,
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
          messages: anthropicMessages,
          system: options?.systemPrompt
        })
      });

      if (!response.ok) {
        throw new AIError(`Claude API error: ${response.status} ${response.statusText}`, 'claude');
      }

      const data = await response.json() as AnthropicResponse;
      
      return {
        content: this.extractTextContent(data.content),
        provider: 'claude',
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.input_tokens,
          completion_tokens: data.usage?.output_tokens,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        metadata: options?.metadata
      };
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(`Claude chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'claude');
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Convert OpenAI ToolDefinition to Anthropic tool format
   * This is the adapter pattern for format differences!
   */
  private convertToAnthropicTools(toolDefinitions: ToolDefinition[]): AnthropicTool[] {
    return toolDefinitions.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: {
        type: 'object',
        properties: tool.function.parameters.properties,
        required: tool.function.parameters.required
      }
    }));
  }

  /**
   * Extract text content from Anthropic's mixed content array
   */
  private extractTextContent(content: AnthropicContent[]): string {
    return content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')
      .trim();
  }
}
