/**
 * Mistral AI Provider for SYNET AI Unit
 * Supports Mistral models via official API
 */

import type { 
    IAI, 
    AIResponse, 
    ChatMessage, 
    AskOptions, 
    MistralChatOptions, 
    ToolsRequest, 
    ToolDefinition 
} from '../types.js';

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
        function: {
          name: string;
          arguments: string;
        };
        index?: number; // Mistral includes index
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  _timing?: {
    duration: number;
  };
}

export async function callMistral(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    tools?: Array<ToolDefinition>;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    randomSeed?: number;
    stop?: string | string[];
    presencePenalty?: number;
    frequencyPenalty?: number;
    n?: number;
    safePrompt?: boolean;
    stream?: boolean;
    parallel_tool_calls?: boolean;
  } = {}
): Promise<MistralResponse> {
  const startTime = Date.now();
  const url = 'https://api.mistral.ai/v1/chat/completions';
  
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4000,
  };

  // Add optional parameters
  if (options.topP !== undefined) body.top_p = options.topP;
  if (options.randomSeed !== undefined) body.random_seed = options.randomSeed;
  if (options.stop !== undefined) body.stop = options.stop;
  if (options.presencePenalty !== undefined) body.presence_penalty = options.presencePenalty;
  if (options.frequencyPenalty !== undefined) body.frequency_penalty = options.frequencyPenalty;
  if (options.n !== undefined) body.n = options.n;
  if (options.safePrompt !== undefined) body.safe_prompt = options.safePrompt;
  if (options.stream !== undefined) body.stream = options.stream;

  // Add tools in the correct Mistral format
  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
    body.tool_choice = 'auto';
    body.parallel_tool_calls = options.parallel_tool_calls ?? true;
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
    console.error('❌ Mistral API Error Response:', error);
    throw new Error(`Mistral API error (${response.status}): ${error}`);
  }

  const result = await response.json() as MistralResponse;
  const duration = Date.now() - startTime;
  
  // Add timing metadata
  result._timing = { duration };
  
  return result;
}

export class Mistral implements IAI {
  constructor(
    private apiKey: string,
    private model: string | 'mistral-large-latest',
    private options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      randomSeed?: number;
      stop?: string | string[];
      presencePenalty?: number;
      frequencyPenalty?: number;
      n?: number;
      safePrompt?: boolean;
    } = {}
  ) {}

  async ask(prompt: string, options: MistralChatOptions & { tools?: ToolDefinition[] } = {}): Promise<AIResponse> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.chat(messages, options);
  }

  async chat(messages: ChatMessage[], options: MistralChatOptions & { tools?: ToolDefinition[] } = {}): Promise<AIResponse> {
    try {
      // Clean messages - Mistral API doesn't support metadata  
      // Filter out empty assistant messages that cause API errors
      const cleanMessages = messages
        .filter(msg => !(msg.role === 'assistant' && (!msg.content || msg.content.trim() === '')))
        .map(msg => ({
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
          topP: options.topP || this.options.topP,
          randomSeed: options.randomSeed || this.options.randomSeed,
          stop: options.stop || this.options.stop,
          presencePenalty: options.presencePenalty || this.options.presencePenalty,
          frequencyPenalty: options.frequencyPenalty || this.options.frequencyPenalty,
          n: options.n || this.options.n,
          safePrompt: options.safePrompt ?? this.options.safePrompt,
          stream: options.stream ?? false, // Default to non-streaming
          parallel_tool_calls: options.parallelToolCalls ?? true // Default to true for Mistral
        }
      );

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No response choices from Mistral');
      }

      const toolCalls = choice.message.tool_calls?.map(tc => {
        try {
          return {
            id: tc.id,
            type: 'function' as const, // Mistral doesn't return type, so we add it
            function: {
              name: tc.function.name,
              arguments: typeof tc.function.arguments === 'string' 
                ? JSON.parse(tc.function.arguments) 
                : tc.function.arguments,
            },
          };
        } catch (parseError) {
          console.warn('Failed to parse tool call arguments:', tc.function.arguments);
          return {
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments, // Return as string if parsing fails
            },
          };
        }
      });

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
        metadata: response._timing ? { timing: response._timing } : undefined,
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
