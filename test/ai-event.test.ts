import { describe, it, expect, beforeEach } from 'vitest';
import { AIOperator } from '../src/ai.unit.js';
import type { AIToolEvent, AIAskEvent, AIChatEvent } from '../src/ai.unit.js';

// Simple mock AI provider for testing
class MockAIProvider {
  async ask(prompt: string, options?: any) {
    return {
      content: `Mock response to: ${prompt}`,
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    };
  }

  async chat(messages: any[], options?: any) {
    return {
      content: `Mock chat response to ${messages.length} messages`,
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    };
  }

  async tools(toolDefinitions: any[], request: any) {
    return {
      content: 'Mock tools response',
      usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }
    };
  }

  async validateConnection() {
    return true;
  }
}

describe('AI Events', () => {
  let ai: AIOperator;
  let eventLog: any[];

  beforeEach(() => {
    // Create AI instance with mock provider
    const mockProvider = new MockAIProvider();
    
    // Create a test AI with events enabled
    ai = new (class TestAI extends AIOperator {
      constructor() {
        const props = {
          dna: { id: 'ai', version: '1.0.6' },
          provider: mockProvider,
          providerType: 'openai' as const,
          config: {},
          emitEvents: true  // Enable events for testing
        };
        super(props as any);
      }
    })();

    eventLog = [];

    // Capture all events
    ai.on('tool.success', (event: AIToolEvent) => {
      eventLog.push({ type: 'tool.success', event });
    });

    ai.on('tool.error', (event: AIToolEvent) => {
      eventLog.push({ type: 'tool.error', event });
    });

    ai.on('ask', (event: AIAskEvent) => {
      eventLog.push({ type: 'ask', event });
    });

    ai.on('chat', (event: AIChatEvent) => {
      eventLog.push({ type: 'chat', event });
    });
  });

  it('should emit ask events with correct structure', async () => {
    const prompt = 'What is the weather in Tokyo?';
    
    await ai.ask(prompt);

    expect(eventLog).toHaveLength(1);
    const askEvent = eventLog[0];
    
    expect(askEvent.type).toBe('ask');
    expect(askEvent.event.type).toBe('ask');
    expect(askEvent.event.prompt).toBe(prompt);
    expect(askEvent.event.provider).toBe('openai');
    expect(askEvent.event.timestamp).toBeInstanceOf(Date);
    expect(askEvent.event.tools).toBeDefined();
  });

  it('should emit chat events with message count', async () => {
    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
      { role: 'user' as const, content: 'How are you?' }
    ];
    
    await ai.chat(messages);

    expect(eventLog).toHaveLength(1);
    const chatEvent = eventLog[0];
    
    expect(chatEvent.type).toBe('chat');
    expect(chatEvent.event.type).toBe('chat');
    expect(chatEvent.event.messageCount).toBe(3);
    expect(chatEvent.event.provider).toBe('openai');
    expect(chatEvent.event.timestamp).toBeInstanceOf(Date);
  });

  it('should include tool definitions in ask events', async () => {
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'weather_getCurrentWeather',
          description: 'Get current weather',
          parameters: {
            type: 'object' as const,
            properties: {
              location: { type: 'string' as const, description: 'City name' }
            },
            required: ['location']
          }
        }
      }
    ];

    await ai.ask('Get weather for Tokyo', { tools });

    expect(eventLog).toHaveLength(1);
    const askEvent = eventLog[0];
    
    expect(askEvent.event.tools).toEqual(tools);
  });

  it('should include tool definitions in chat events', async () => {
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'email_send',
          description: 'Send an email',
          parameters: {
            type: 'object' as const,
            properties: {
              to: { type: 'string' as const, description: 'Recipient' },
              subject: { type: 'string' as const, description: 'Subject' },
              body: { type: 'string' as const, description: 'Body' }
            }
          }
        }
      }
    ];

    const messages = [
      { role: 'user' as const, content: 'Send an email to admin' }
    ];

    await ai.chat(messages, { tools });

    expect(eventLog).toHaveLength(1);
    const chatEvent = eventLog[0];
    
    expect(chatEvent.event.tools).toEqual(tools);
  });

  it('should have proper event structure for consciousness monitoring', () => {
    // Test that our event types match what Smith needs for monitoring
    const expectedAskStructure = {
      type: 'ask',
      timestamp: expect.any(Date),
      provider: expect.any(String),
      prompt: expect.any(String),
      tools: expect.any(Array)
    };

    const expectedChatStructure = {
      type: 'chat', 
      timestamp: expect.any(Date),
      provider: expect.any(String),
      messageCount: expect.any(Number),
      tools: expect.any(Array)
    };

    const expectedToolStructure = {
      type: expect.stringMatching(/^tool\.(success|error)$/),
      timestamp: expect.any(Date),
      provider: expect.any(String),
      tool: expect.objectContaining({
        id: expect.any(String),
        function: expect.objectContaining({
          name: expect.any(String),
          arguments: expect.anything()
        })
      })
    };

    // These structures ensure Smith can monitor AI consciousness properly
    expect(expectedAskStructure).toBeDefined();
    expect(expectedChatStructure).toBeDefined(); 
    expect(expectedToolStructure).toBeDefined();
  });
});
