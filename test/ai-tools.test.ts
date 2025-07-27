import { describe, test, expect } from 'vitest';
import { AI } from '../src/ai.js';
import { CalculatorUnit } from '../src/tools/calculator.unit.js';

describe('AI Tools Integration', () => {
  test('should create tool definitions from calculator unit', () => {
    const ai = AI.openai({ 
      apiKey: 'test-key',
      model: 'gpt-4o-mini'
    });

    const calculator = CalculatorUnit.create();
    const teachingContract = calculator.teach();
    
    // Verify teaching contract structure
    expect(teachingContract.unitId).toBe(calculator.dna.id);
    expect(teachingContract.capabilities).toBeDefined();
    expect(Object.keys(teachingContract.capabilities).length).toBeGreaterThan(0);

    // Convert to tool definitions
    const toolDefinitions = ai.createToolDefinitions([teachingContract]);
    
    expect(toolDefinitions.length).toBeGreaterThan(0);
    expect(toolDefinitions[0].type).toBe('function');
    expect(toolDefinitions[0].function.name).toContain('calculator');
    expect(toolDefinitions[0].function.description).toBeTruthy();
  });

  test('should handle calculator operations through teaching contract', async () => {
    const calculator = CalculatorUnit.create();
    const teachingContract = calculator.teach();
    
    // Test that we can call capabilities through the contract
    const addCapability = teachingContract.capabilities.add;
    expect(typeof addCapability).toBe('function');
    
    // Test actual calculation - note: wrapped methods return the result directly
    const result = await addCapability(5, 3);
    expect(result.result).toBe(8);
    expect(result.operation).toBe('5 + 3 = 8');
  });

  test('should create multiple tool definitions for different capabilities', () => {
    const ai = AI.openai({ 
      apiKey: 'test-key',
      model: 'gpt-4o-mini'
    });

    const calculator = CalculatorUnit.create();
    const toolDefinitions = ai.createToolDefinitions([calculator.teach()]);
    
    // Calculator should have multiple operations
    const toolNames = toolDefinitions.map(t => t.function.name);
    expect(toolNames).toContain('calculator.add');
    expect(toolNames).toContain('calculator.multiply');
    expect(toolDefinitions.length).toBeGreaterThanOrEqual(4); // add, subtract, multiply, divide
  });

  test('should namespace tool names correctly', () => {
    const ai = AI.openai({ 
      apiKey: 'test-key',
      model: 'gpt-4o-mini'
    });

    const calculator = CalculatorUnit.create();
    const toolDefinitions = ai.createToolDefinitions([calculator.teach()]);
    
    // All tools should be namespaced with calculator unit ID
    for (const tool of toolDefinitions) {
      expect(tool.function.name).toMatch(/^calculator\./);
    }
  });
});
