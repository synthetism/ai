/**
 * AI Event Demo - Real-time consciousness monitoring
 * 
 * Shows how to observe AI orchestrating unit ecosystem through events.
 * Perfect for debugging Smith's worker delegation patterns.
 */

import { AIOperator } from '../src/ai.unit.js';
import type { AIToolEvent, AIAskEvent, AIChatEvent } from '../src/ai.unit.js';

async function demonstrateAIEvents() {
  console.log('🔮 AI Event Consciousness Demo\n');

  // Create AI with events enabled (this is the key - conscious observer mode)
  const ai = AIOperator.create({
    type: 'openai',
    options: {
      apiKey: process.env.OPENAI_API_KEY || 'demo-key'
    }
  });

  // Override emitEvents for demo (normally set in props)
  (ai as any).props.emitEvents = true;

  console.log('📡 Setting up event listeners...\n');

  // Tool execution observatory - the crown jewel for Smith
  ai.on('tool.success', (event: AIToolEvent) => {
    console.log(`✅ Tool Success: ${event.tool.function.name}`);
    console.log(`   Duration: ${event.duration}ms`);
    console.log(`   Arguments:`, typeof event.tool.function.arguments === 'string' 
      ? JSON.parse(event.tool.function.arguments) 
      : event.tool.function.arguments);
    console.log(`   Result:`, event.result);
    console.log(`   Provider: ${event.provider}`);
    console.log();
  });

  ai.on('tool.error', (event: AIToolEvent) => {
    console.log(`❌ Tool Error: ${event.tool.function.name}`);
    console.log(`   Duration: ${event.duration}ms`);
    console.log(`   Error:`, event.error?.message);
    console.log(`   Provider: ${event.provider}`);
    console.log();
  });

  // Conversation tracking - essential for monitoring AI flow
  ai.on('ask', (event: AIAskEvent) => {
    console.log(`🤖 Ask: "${event.prompt}"`);
    console.log(`   Provider: ${event.provider}`);
    console.log(`   Tools Available: ${event.tools?.length || 0}`);
    if (event.tools?.length) {
      console.log(`   Tool Names:`, event.tools.map(t => t.function.name).join(', '));
    }
    console.log();
  });

  ai.on('chat', (event: AIChatEvent) => {
    console.log(`💬 Chat: ${event.messageCount} messages`);
    console.log(`   Provider: ${event.provider}`);
    console.log(`   Tools Available: ${event.tools?.length || 0}`);
    if (event.tools?.length) {
      console.log(`   Tool Schemas:`, event.tools.map(t => t.function.name).join(', '));
    }
    console.log();
  });

  console.log('🎭 Running AI consciousness scenarios...\n');

  try {
    // Scenario 1: Simple ask with tool definition
    console.log('--- Scenario 1: Ask with Tool Schema ---');
    await ai.ask("What's the weather in Tokyo?", {
      tools: [
        {
          type: 'function' as const,
          function: {
            name: 'weather_getCurrentWeather',
            description: 'Get current weather for a location',
            parameters: {
              type: 'object' as const,
              properties: {
                location: { type: 'string' as const, description: 'City name' }
              },
              required: ['location']
            }
          }
        }
      ]
    });

    // Scenario 2: Chat with multiple tools (shows full schema debugging)
    console.log('--- Scenario 2: Chat with Multiple Tool Schemas ---');
    await ai.chat([
      { role: 'system' as const, content: 'You are a helpful assistant' },
      { role: 'user' as const, content: 'Check weather and send email summary' }
    ], {
      tools: [
        {
          type: 'function' as const,
          function: {
            name: 'weather_getCurrentWeather',
            description: 'Get current weather',
            parameters: {
              type: 'object' as const,
              properties: {
                location: { type: 'string' as const, description: 'Location' }
              }
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'email_send',
            description: 'Send email',
            parameters: {
              type: 'object' as const,
              properties: {
                to: { type: 'string' as const, description: 'Recipient' },
                subject: { type: 'string' as const, description: 'Subject' },
                body: { type: 'string' as const, description: 'Body' }
              },
              required: ['to', 'subject', 'body']
            }
          }
        }
      ]
    });

    // Scenario 3: Ask without tools (shows minimal event)
    console.log('--- Scenario 3: Simple Ask (No Tools) ---');
    await ai.ask("Hello, how are you today?");

  } catch (error) {
    console.log('Demo completed with some expected mock responses');
  }

  console.log('🎉 Event demonstration complete!\n');
  console.log('This shows how Smith can observe:');
  console.log('• 📊 Which tools workers are calling (tool.function.name)');
  console.log('• ⏱️  How long operations take (duration)');
  console.log('• 📝 What arguments are passed (tool.function.arguments)');
  console.log('• ✅❌ Success/failure patterns (tool.success/tool.error)');
  console.log('• 🔧 Full tool schema debugging info (tools array)');
  console.log('• 🤖 AI conversation patterns (ask/chat events)');
  console.log('\n💡 Key insight: emitEvents=true enables consciousness monitoring');
  console.log('   When debugging: set emitEvents=true');
  console.log('   In production: set emitEvents=false for performance');
}

// Run the demo
if (process.env.NODE_ENV !== 'test') {
  demonstrateAIEvents().catch(console.error);
}

export { demonstrateAIEvents };
