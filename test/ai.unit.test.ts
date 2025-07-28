/**
 * AI Unit Tests - Core functionality testing
 * 
 * Tests Unit Architecture v1.0.6 compliance:
 * - Unit creation and lifecycle
 * - Teaching/learning capabilities
 * - Tool schema handling
 * - Provider integration
 * - Evolution functionality
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { AIOperator, AI } from '../src/ai.js';
import type { ToolDefinition } from '../src/types.js';

// Mock calculator unit for testing
class MockCalculatorUnit {
  static create() {
    return new MockCalculatorUnit();
  }

  teach() {
    return {
      unitId: 'calculator',
      capabilities: {
        add: (...args: unknown[]) => {
          const [a, b] = args as [number, number];
          return a + b;
        },
        multiply: (...args: unknown[]) => {
          const [a, b] = args as [number, number]; 
          return a * b;
        },
      },
      tools: {
        add: {
          name: 'add',
          description: 'Add two numbers',
          parameters: {
            type: 'object' as const,
            properties: {
              a: { type: 'number' as const, description: 'First number' },
              b: { type: 'number' as const, description: 'Second number' }
            },
            required: ['a', 'b']
          }
        },
        multiply: {
          name: 'multiply',
          description: 'Multiply two numbers', 
          parameters: {
            type: 'object' as const,
            properties: {
              a: { type: 'number' as const, description: 'First number' },
              b: { type: 'number' as const, description: 'Second number' }
            },
            required: ['a', 'b']
          }
        }
      }
    };
  }
}

describe('AI Unit Architecture', () => {
  let ai: AIOperator;

  beforeEach(() => {
    // Create AI unit with mock configuration (no real API calls)
    ai = AIOperator.create({
      type: 'openai',
      options: {
        apiKey: 'sk-test-key',
        model: 'gpt-4o-mini'
      }
    });
  });

  describe('Unit Creation and Identity', () => {
    test('should create AI unit with proper DNA', () => {
      expect(ai).toBeDefined();
      expect(ai.dna).toBeDefined();
      expect(ai.dna.id).toBe('ai');
      expect(ai.dna.version).toBe('1.0.6');
    });

    test('should implement Unit Architecture interface', () => {
      expect(typeof ai.whoami).toBe('function');
      expect(typeof ai.capabilities).toBe('function');
      expect(typeof ai.can).toBe('function');
      expect(typeof ai.help).toBe('function');
      expect(typeof ai.execute).toBe('function');
      expect(typeof ai.teach).toBe('function');
      expect(typeof ai.learn).toBe('function');
      expect(typeof ai.evolve).toBe('function');
    });

    test('should implement AI-specific interface', () => {
      expect(typeof ai.ask).toBe('function');
      expect(typeof ai.chat).toBe('function');
      expect(typeof ai.call).toBe('function');
      expect(typeof ai.tools).toBe('function');
      expect(typeof ai.validateConnection).toBe('function');
    });

    test('should provide self-identification', () => {
      const identity = ai.whoami();
      expect(identity).toContain('AI Unit');
      expect(identity).toContain('openai');
    });

    test('should show native capabilities', () => {
      const capabilities = ai.capabilities();
      expect(capabilities).toContain('ai.ask');
      expect(capabilities).toContain('ai.chat');
      expect(capabilities).toContain('ai.call');
      expect(capabilities).toContain('ai.tools');
      expect(capabilities).toContain('ai.validateConnection');
    });
  });

  describe('Teaching/Learning Capabilities', () => {
    test('should provide teaching contract', () => {
      const contract = ai.teach();
      expect(contract).toBeDefined();
      expect(contract.unitId).toBe('ai');
      expect(contract.capabilities).toBeDefined();
      expect(typeof contract.capabilities.ask).toBe('function');
      expect(typeof contract.capabilities.chat).toBe('function');
      expect(typeof contract.capabilities.call).toBe('function');
    });

    test('should learn capabilities from other units', () => {
      const calculator = MockCalculatorUnit.create();
      
      ai.learn([calculator.teach()]);
      
      // Check learned capabilities via can() method
      expect(ai.can('calculator.add')).toBe(true);
      expect(ai.can('calculator.multiply')).toBe(true);
    });

    test('should execute learned capabilities', async () => {
      const calculator = MockCalculatorUnit.create();
      ai.learn([calculator.teach()]);
      
      expect(ai.can('calculator.add')).toBe(true);
      expect(ai.can('calculator.multiply')).toBe(true);
      
      const addResult = await ai.execute('calculator.add', 5, 3);
      expect(addResult).toBe(8);
      
      const multiplyResult = await ai.execute('calculator.multiply', 4, 7);
      expect(multiplyResult).toBe(28);
    });

    test('should handle unknown capabilities gracefully', async () => {
      expect(ai.can('nonexistent.capability')).toBe(false);
      
      await expect(ai.execute('nonexistent.capability')).rejects.toThrow('Unknown command');
    });
  });

  describe('Tool Schema Handling (v1.0.6)', () => {
    test('should store and access tool schemas after learning', () => {
      const calculator = MockCalculatorUnit.create();
      ai.learn([calculator.teach()]);
      
      const schemas = ai.schemas();
      expect(schemas).toContain('calculator.add');
      expect(schemas).toContain('calculator.multiply');
      
      expect(ai.hasSchema('calculator.add')).toBe(true);
      expect(ai.hasSchema('calculator.nonexistent')).toBe(false);
    });

    test('should retrieve specific tool schemas', () => {
      const calculator = MockCalculatorUnit.create();
      ai.learn([calculator.teach()]);
      
      const addSchema = ai.getSchema('calculator.add');
      expect(addSchema).toBeDefined();
      expect(addSchema?.name).toBe('calculator.add');
      expect(addSchema?.description).toBe('Add two numbers');
      expect(addSchema?.parameters.required).toEqual(['a', 'b']);
    });

    test('should validate schema names during learning', () => {
      const invalidContract = {
        unitId: 'test',
        capabilities: {
          add: (...args: unknown[]) => {
            const [a, b] = args as [number, number];
            return a + b;
          }
        },
        tools: {
          add: {
            name: 'wrong-name', // This should cause an error
            description: 'Add two numbers',
            parameters: {
              type: 'object' as const,
              properties: {},
              required: []
            }
          }
        }
      };

      expect(() => {
        ai.learn([invalidContract]);
      }).toThrow('Tool schema name \'wrong-name\' must match capability \'add\'');
    });
  });

  describe('Evolution Functionality', () => {
    test('should evolve with preserved capabilities', () => {
      const calculator = MockCalculatorUnit.create();
      ai.learn([calculator.teach()]);
      
      const evolved = ai.evolve('advanced-ai', {
        customCapability: () => 'custom result'
      });
      
      // Check evolution lineage
      expect(evolved.dna.id).toBe('advanced-ai');
      expect(evolved.dna.parent?.id).toBe('ai');
      
      // Check preserved capabilities
      expect(evolved.can('calculator.add')).toBe(true);
      expect(evolved.can('customCapability')).toBe(true);
      
      // Check preserved schemas
      expect(evolved.hasSchema('calculator.add')).toBe(true);
    });
  });

  describe('Factory Methods', () => {
    test('should create AI units via factory shortcuts', () => {
      const openaiAI = AI.openai({ apiKey: 'sk-test' });
      expect(openaiAI.dna.id).toBe('ai');
      
      const claudeAI = AI.claude({ apiKey: 'sk-test' });
      expect(claudeAI.dna.id).toBe('ai');
      
      const deepseekAI = AI.deepseek({ apiKey: 'sk-test' });
      expect(deepseekAI.dna.id).toBe('ai');
    });

    test('should create AI units via main factory', () => {
      const ai = AI.create({
        type: 'openai',
        options: { apiKey: 'sk-test', model: 'gpt-4o' }
      });
      
      expect(ai.dna.id).toBe('ai');
      expect(ai.whoami()).toContain('openai');
    });

    test('should provide preset configurations', () => {
      const devAI = AI.presets.development('sk-test');
      expect(devAI.dna.id).toBe('ai');
      
      const prodAI = AI.presets.production('sk-test');
      expect(prodAI.dna.id).toBe('ai');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid provider type', () => {
      expect(() => {
        AI.create({
          type: 'invalid-provider' as never,
          options: { apiKey: 'test' }
        });
      }).toThrow('Unsupported AI provider');
    });

    test('should handle missing configuration', () => {
      expect(() => {
        AI.create({
          type: 'openai',
          options: {} // Missing apiKey
        });
      }).toThrow('OpenAI provider requires apiKey');
    });
  });

  describe('Tool Definitions', () => {
    test('should handle tool definitions in tools method', async () => {
      const toolDefs: ToolDefinition[] = [
        {
          type: 'function',
          function: {
            name: 'test-tool',
            description: 'A test tool',
            parameters: {
              type: 'object',
              properties: {
                input: { type: 'string', description: 'Test input' }
              },
              required: ['input']
            }
          }
        }
      ];

      // This will fail with mock API key, but tests the structure
      try {
        await ai.tools(toolDefs, { prompt: 'Test prompt' });
      } catch (error) {
        // Expected to fail with invalid API key
        expect(error).toBeDefined();
      }
    });
  });
});

describe('Unit Architecture Compliance', () => {
  test('should follow protected constructor pattern', () => {
    // Cannot test constructor directly, but can verify factory works
    const ai = AIOperator.create({
      type: 'openai',
      options: { apiKey: 'sk-test' }
    });
    
    expect(ai).toBeInstanceOf(AIOperator);
  });

  test('should preserve ValueObject equality', () => {
    const ai1 = AI.openai({ apiKey: 'sk-test', model: 'gpt-4o' });
    const ai2 = AI.openai({ apiKey: 'sk-test', model: 'gpt-4o' });
    
    // Same configuration should be equal
    expect(ai1.equals(ai2)).toBe(true);
  });

  test('should provide help documentation', () => {
    const ai = AI.openai({ apiKey: 'sk-test' });
    
    // Should not throw when calling help
    expect(() => {
      ai.help();
    }).not.toThrow();
  });
});
