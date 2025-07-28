/**
 * Mistral AI Provider for SYNET AI Unit
 * Supports Mistral models via official API
 */

import type { IAI, AIResponse, ChatMessage, AskOptions, ChatOptions, ToolsRequest, ToolDefinition } from '../types.js';

export interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callMistral(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    tools?: Array<any>;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<MistralResponse> {
  const url = 'https://api.mistral.ai/v1/chat/completions';
  
  const body: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4000,
  };

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error (${response.status}): ${error}`);
  }

  return response.json() as Promise<MistralResponse>;
}

export class Mistral implements IAI {
  constructor(
    private apiKey: string,
    private model: string = 'mistral-large-latest',
    private options: { temperature?: number; maxTokens?: number } = {}
  ) {}

  async ask(prompt: string, options: AskOptions & { tools?: ToolDefinition[] } = {}): Promise<AIResponse> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.chat(messages, options);
  }

  async chat(messages: ChatMessage[], options: ChatOptions & { tools?: ToolDefinition[] } = {}): Promise<AIResponse> {
    try {
      // Clean messages - Mistral API doesn't support metadata
      const cleanMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await callMistral(
        this.apiKey,
        options.model || this.model,
        cleanMessages,
        {
          tools: options.tools,
          temperature: options.temperature || this.options.temperature,
          maxTokens: options.maxTokens || this.options.maxTokens,
        }
      );

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No response choices from Mistral');
      }

      const toolCalls = choice.message.tool_calls?.map(tc => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        },
      }));

      return {
        content: choice.message.content || '',
        provider: 'mistral',
        model: response.model,
        toolCalls,
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      throw new Error(`Mistral provider error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async tools(toolDefinitions: ToolDefinition[], request: ToolsRequest): Promise<AIResponse> {
    const messages: ChatMessage[] = [
      { role: 'system', content: request.systemPrompt || 'You are a helpful assistant with access to tools. Use them when appropriate.' },
      { role: 'user', content: request.prompt || request.instructions || 'Please help me with this task.' },
    ];

    return this.chat(messages, { tools: toolDefinitions });
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.ask('Test connection');
      return true;
    } catch {
      return false;
    }
  }
}
