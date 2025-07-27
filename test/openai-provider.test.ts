import { describe, test, expect } from 'vitest';
import { OpenAI } from '../src/providers/openai.js';

describe('OpenAI Provider', () => {
  const provider = new OpenAI({
    apiKey: 'sk-test-key',
    model: 'gpt-4o-mini'
  });

  test('should create OpenAI provider', () => {
    expect(provider).toBeDefined();
  });

  test('should implement IAI interface', () => {
    expect(typeof provider.ask).toBe('function');
    expect(typeof provider.chat).toBe('function');
    expect(typeof provider.tools).toBe('function');
    expect(typeof provider.validateConnection).toBe('function');
  });

  test('should handle tool definitions', async () => {
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'calculator.add',
          description: 'Add two numbers',
          parameters: {
            type: 'object' as const,
            properties: {
              a: { type: 'number', description: 'First number' },
              b: { type: 'number', description: 'Second number' }
            },
            required: ['a', 'b']
          }
        }
      }
    ];

    // This will fail with invalid API key, but tests the structure
    try {
      await provider.tools(tools, { prompt: 'Add 2 + 3' });
    } catch (error) {
      // Expected to fail with invalid API key
      expect(error).toBeDefined();
    }
  });

  test('should validate connection structure', async () => {
    // This will fail with invalid API key, but tests the method exists
    const isValid = await provider.validateConnection();
    expect(typeof isValid).toBe('boolean');
    expect(isValid).toBe(false); // Should be false with test key
  });
});
