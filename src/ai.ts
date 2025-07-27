/**
 * AI - Clean factory for AI units
 * 
 * Following @synet/fs pattern for clean provider organization
 * 
 * Usage:
 * ```typescript
 * // Quick AI provider creation
 * const ai = AI.openai({ apiKey: 'sk-...' });
 * const response = await ai.ask('What is 2+2?');
 * 
 * // Tool calling
 * const tools = ai.createToolDefinitions([calculator.teach()]);
 * await ai.tools(tools, { prompt: 'Calculate 25 * 4' });
 * ```
 */

import { AI as AIUnit } from './ai-solid.unit.js';
import type { OpenAIConfig } from './types.js';

export const AI = {
  /**
   * OpenAI provider - Most popular AI provider
   */
  openai: (config: OpenAIConfig) => AIUnit.openai(config),

  // TODO: Add other providers
  // deepseek: (config: DeepseekConfig) => AIUnit.deepseek(config),
  // anthropic: (config: AnthropicConfig) => AIUnit.anthropic(config),
  // gemini: (config: GeminiConfig) => AIUnit.gemini(config),

  /**
   * Quick presets for common scenarios
   */
  presets: {
    /**
     * Development setup: OpenAI with reasonable defaults
     */
    development: (apiKey: string) => AI.openai({
      apiKey,
      model: 'gpt-4o-mini',
      timeout: 30000
    }),

    /**
     * Production setup: OpenAI with optimized settings
     */
    production: (apiKey: string) => AI.openai({
      apiKey,
      model: 'gpt-4o',
      timeout: 60000,
      maxRetries: 3
    }),
  }
};

// Re-export the AI unit for direct usage if needed
export { AIUnit };
export type { OpenAIConfig } from './types.js';
