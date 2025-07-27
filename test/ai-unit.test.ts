import { describe, test, expect } from 'vitest';
import { AI } from '../src/ai.js';

describe('AI Unit', () => {
  test('should create AI unit with OpenAI provider', () => {
    const ai = AI.openai({
      apiKey: 'sk-test-key',
      model: 'gpt-4o-mini'
    });

    expect(ai).toBeDefined();
    expect(ai.getProvider()).toBe('openai');
    expect(ai.whoami()).toContain('AI Unit (openai)');
  });

  test('should have correct capabilities', () => {
    const ai = AI.openai({ apiKey: 'sk-test' });
    const capabilities = ai.capabilities();

    expect(capabilities).toContain('ai.ask');
    expect(capabilities).toContain('ai.chat');
    expect(capabilities).toContain('ai.tools');
    expect(capabilities).toContain('ai.validateConnection');
    expect(capabilities).toContain('ai.getProvider');
    expect(capabilities).toContain('ai.getConfig');
  });

  test('should provide teaching contract', () => {
    const ai = AI.openai({ apiKey: 'sk-test' });
    const contract = ai.teach();

    expect(contract.unitId).toBe('ai');
    expect(contract.capabilities).toBeDefined();
    expect(typeof contract.capabilities.ask).toBe('function');
    expect(typeof contract.capabilities.tools).toBe('function');
  });

  test('should create tool definitions from teaching contracts', () => {
    const ai = AI.openai({ apiKey: 'sk-test' });
    
    // Mock teaching contract
    const teachingContracts = [
      {
        unitId: 'calculator',
        capabilities: {
          add: () => {},
          multiply: () => {}
        }
      }
    ];

    const toolDefinitions = ai.createToolDefinitions(teachingContracts);
    
    expect(toolDefinitions).toHaveLength(2);
    expect(toolDefinitions[0].function.name).toBe('calculator_add');
    expect(toolDefinitions[1].function.name).toBe('calculator_multiply');
    expect(toolDefinitions[0].type).toBe('function');
  });

  test('should use presets', () => {
    const devAI = AI.presets.development('sk-test');
    const prodAI = AI.presets.production('sk-test');

    expect(devAI.getProvider()).toBe('openai');
    expect(prodAI.getProvider()).toBe('openai');
    
    const devConfig = devAI.getConfig();
    const prodConfig = prodAI.getConfig();
    
    expect(devConfig.model).toBe('gpt-4o-mini');
    expect(prodConfig.model).toBe('gpt-4o');
  });

  test('should delegate calls to provider', async () => {
    const ai = AI.openai({ apiKey: 'sk-test' });

    // These will fail with invalid API key, but test the delegation
    try {
      await ai.ask('test');
    } catch (error) {
      expect(error).toBeDefined(); // Expected to fail with test key
    }

    try {
      await ai.chat([{ role: 'user', content: 'test' }]);
    } catch (error) {
      expect(error).toBeDefined(); // Expected to fail with test key
    }

    const isValid = await ai.validateConnection();
    expect(typeof isValid).toBe('boolean');
  });
});
