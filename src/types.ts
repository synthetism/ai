/**
 * @synet/ai - Core AI types and interfaces
 * 
 * Defines the foundation for AI units and providers following SYNET architecture
 */

import type { TeachingContract } from '@synet/unit';

// =============================================================================
// CORE AI INTERFACES
// =============================================================================

/**
 * IAI - Universal AI interface that all providers must implement
 * v1.0.6 Clean Interface - tools are optional enhancements
 */
export interface IAI {
  ask(prompt: string, options?: AskOptions & { tools?: ToolDefinition[] }): Promise<AIResponse>;
  chat(messages: ChatMessage[], options?: ChatOptions & { tools?: ToolDefinition[] }): Promise<AIResponse>;
  tools(toolDefinitions: ToolDefinition[], request: ToolsRequest): Promise<AIResponse>;
  validateConnection(): Promise<boolean>;
}

// =============================================================================
// CORE AI TYPES
// =============================================================================

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AIResponse {
  content: string;
  provider: string;
  model?: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  metadata?: Record<string, unknown> & {
    timing?: {
      duration: number;
    };
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AskOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}

export interface ImageOptions {
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface MistralChatOptions extends ChatOptions {
  parallelToolCalls?: boolean; // Whether to allow parallel tool calls
  topP?: number; // Nucleus sampling
  randomSeed?: number; // Deterministic results
  stop?: string | string[]; // Stop sequences
  presencePenalty?: number; // Penalize repetition (-2 to 2)
  frequencyPenalty?: number; // Penalize frequent words (-2 to 2)
  n?: number; // Number of completions
  safePrompt?: boolean; // Inject safety prompt
  stream?: boolean; // Stream response
}

export interface CallOptions extends AskOptions {
  /** Use all learned tool schemas automatically */
  useTools?: boolean;
  /** Use specific learned schemas only */
  schemas?: string[];
  /** Add custom tool definitions */
  tools?: ToolDefinition[];
}

export interface ToolsRequest {
  prompt?: string;
  instructions?: string;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// PROVIDER TYPES
// =============================================================================

export type AIProviderType = 'openai' | 'claude' | 'anthropic' | 'deepseek' | 'grok' | 'gemini' | 'bedrock' | 'mistral' | 'openrouter' | 'local';

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// MEMORY INTERFACES (Basic foundation for future)
// =============================================================================

export interface IMemory {
  store(key: string, value: unknown, metadata?: Record<string, unknown>): Promise<void>;
  retrieve(key: string): Promise<unknown>;
  search(query: string, limit?: number): Promise<MemoryResult[]>;
  clear(): Promise<void>;
}

export interface MemoryResult {
  key: string;
  value: unknown;
  score?: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// UNIT CONFIGURATION TYPES
// =============================================================================

export interface AIConfig<T extends AIProviderType = AIProviderType> {
  type: T;
  options: AIProviderConfig;
  memory?: IMemory;
}

export interface SimpleAIConfig {
  provider: AIProviderType;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  baseURL?: string;
}

export interface OpenAIConfig extends AIProviderConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface BedrockConfig extends AIProviderConfig {
  apiKey: string;  // AWS session token or bearer token
  region?: string;  // AWS region, defaults to 'us-east-1'
  model?: string;   // Model ID (e.g., 'amazon.nova-pro-v1:0', 'amazon.nova-lite-v1:0')
  timeout?: number;
  maxRetries?: number;
}

export interface MistralConfig extends AIProviderConfig {
  apiKey: string;
  model: string;   // Model ID (e.g., 'mistral-large-latest', 'mistral-small-latest')
  timeout?: number;
  maxRetries?: number;
}

// =============================================================================
// TOOL CALLING TYPES (The revolutionary part!)
// =============================================================================

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
        description: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export class AIError extends Error {
  constructor(
    message: string,
    public provider?: string,
    public code?: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIConnectionError extends AIError {
  constructor(message: string, provider?: string) {
    super(message, provider, 'CONNECTION_ERROR');
    this.name = 'AIConnectionError';
  }
}

export class AIToolError extends AIError {
  constructor(message: string, toolName?: string) {
    super(message, undefined, 'TOOL_ERROR', { toolName });
    this.name = 'AIToolError';
  }
}
