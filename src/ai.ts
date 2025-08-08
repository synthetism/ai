/**
 * AI - Clean factory for AI units
 * 
 * Following     grok: (apiKey: string) => AIOperator.create({ 
      type: 'grok', 
      options: { apiKey, model: 'grok-3-mini' } 
    }),
    gemini: (apiKey: string) => AIOperator.create({ 
      type: 'gemini', 
      options: { apiKey, model: 'gemini-1.5-flash' } 
    })et/fs pattern for clean provider organization
 * 
 * Usage:
 * ```typescript
 * // Provider-specific creation
 * const ai = AI.create({ type: 'openai', options: { apiKey: 'sk-...' } });
 * const response = await ai.ask('What is 2+2?');
 * 
 * // Quick shortcuts
 * const ai = AI.openai({ apiKey: 'sk-...' });
 * const response = await ai.call('Get weather', { useTools: true });
 * ```
 */

import {  AIOperator } from './ai.unit';
import type { OpenAIConfig, BedrockConfig, MistralConfig, AIProviderConfig } from './types.js';

/**
 * AI Factory - Provider shortcuts
 */
export const AI = {
  // Main factory method (like AsyncFileSystem.create)
  create: AIOperator.create.bind(AIOperator),

  // Provider shortcuts
  openai: (config: OpenAIConfig) => AIOperator.create({ type: 'openai', options: config }),
  claude: (config: { apiKey: string; model?: string; baseURL?: string }) => 
    AIOperator.create({ type: 'claude', options: config as Record<string, unknown> }),
  deepseek: (config: { apiKey: string; model?: string; baseURL?: string }) => 
    AIOperator.create({ type: 'deepseek', options: config as Record<string, unknown> }),
  grok: (config: { apiKey: string; model?: string; baseURL?: string }) => 
    AIOperator.create({ type: 'grok', options: config as Record<string, unknown> }),
  gemini: (config: { apiKey: string; model?: string; baseURL?: string }) => 
    AIOperator.create({ type: 'gemini', options: config as Record<string, unknown> }),
  bedrock: (config: BedrockConfig) => 
    AIOperator.create({ type: 'bedrock', options: config }),
  mistral: (config: { apiKey: string; model?: string }) => 
    AIOperator.create({ type: 'mistral', options: config as Record<string, unknown> }),
  openrouter: (config: { apiKey: string; model?: string; baseURL?: string }) => 
    AIOperator.create({ type: 'openrouter', options: config as Record<string, unknown> }),
  
  // Presets for common configurations
  presets: {
    development: (apiKey: string) => AIOperator.create({ 
      type: 'openai', 
      options: { apiKey, model: 'gpt-4o-mini' } 
    }),
    production: (apiKey: string) => AIOperator.create({ 
      type: 'openai', 
      options: { apiKey, model: 'gpt-4o' } 
    }),
    claude: (apiKey: string) => AIOperator.create({ 
      type: 'claude', 
      options: { apiKey, model: 'claude-3-5-sonnet-20241022' } 
    }),
    deepseek: (apiKey: string) => AIOperator.create({ 
      type: 'deepseek', 
      options: { apiKey, model: 'deepseek-chat' } 
    }),
    grok: (apiKey: string) => AIOperator.create({ 
      type: 'grok', 
      options: { apiKey, model: 'grok-beta' } 
    }),
    mistral: (apiKey: string) => AIOperator.create({ 
      type: 'mistral', 
      options: { apiKey, model: 'mistral-medium-latest' } 
    }),
    nova: (apiKey: string, region?: string) => AIOperator.create({
      type: 'bedrock',
      options: { apiKey, model: 'amazon.nova-pro-v1:0', region: region || 'us-east-1' }
    }),
    novaLite: (apiKey: string, region?: string) => AIOperator.create({
      type: 'bedrock', 
      options: { apiKey, model: 'amazon.nova-lite-v1:0', region: region || 'us-east-1' }
    })
  }
};

// Export the unit class for advanced usage
export { AIOperator };

// Export types
export type { AIResponse, ChatMessage, AskOptions, ChatOptions, CallOptions, ToolDefinition, ToolsRequest, BedrockConfig, MistralConfig } from './types.js';
