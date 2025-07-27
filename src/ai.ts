/**
 * AI - Clean factory for AI units
 * 
 * Following @synet/fs pattern for clean provider organization
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
import type { OpenAIConfig } from './types.js';

/**
 * AI Factory - Provider shortcuts
 */
export const AI = {
  // Main factory method (like AsyncFileSystem.create)
  create: AIOperator.create.bind(AIOperator),

  // Provider shortcuts
  openai: (config: OpenAIConfig) => AIOperator.create({ type: 'openai', options: config }),
  
  // Presets for common configurations
  presets: {
    development: (apiKey: string) => AIOperator.create({ 
      type: 'openai', 
      options: { apiKey, model: 'gpt-4o-mini' } 
    }),
    production: (apiKey: string) => AIOperator.create({ 
      type: 'openai', 
      options: { apiKey, model: 'gpt-4o' } 
    })
  }
};

// Export the unit class for advanced usage
export { AIOperator };

// Export types
export type { AIResponse, ChatMessage, AskOptions, ChatOptions, CallOptions, ToolDefinition, ToolsRequest } from './types.js';
