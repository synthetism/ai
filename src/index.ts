/**
 * @synet/ai - AI package with universal interface and tool calling
 * 
 * Clean architecture following @synet/fs pattern:
 * - AI factory for easy provider creation
 * - Clean separation between units and providers
 * - Tool calling with ToolDefinition[] (not TeachingContract[])
 */

// Core types and interfaces
export * from './types.js';

// Main AI factory (recommended usage)
export { AI } from './ai.js';

// Units (for advanced usage)
export { AIOperator } from './ai.js';

// Providers (for direct usage)
export { OpenAI } from './providers/openai.js';

// Tools (working units for AI integration)
export { WeatherUnit } from './tools/weather.unit.js';

// Error classes
export { AIError, AIConnectionError, AIToolError } from './types.js';
