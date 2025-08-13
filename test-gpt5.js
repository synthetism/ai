/**
 * Simple GPT-5 test to isolate the hanging issue
 */
const { AI } = require('./dist/ai.js');
const { readFileSync } = require('fs');

async function testGPT5() {
  console.log('🧪 Testing GPT-5 with simple tools...');
  
  const config = JSON.parse(readFileSync('private/openai.json', 'utf-8'));
  
  const ai = AI.openai({ 
    apiKey: config.apiKey,
    model: 'gpt-5-mini'
  });

  try {
    // Test 1: Simple chat (no tools)
    console.log('\n1. Simple chat test...');
    const chatResponse = await ai.ask('Hello! What model are you?');
    console.log('✅ Chat works:', chatResponse.content.slice(0, 100) + '...');

    // Test 2: Simple tool calling
    console.log('\n2. Simple tool test...');
    const toolResponse = await ai.tools([
      {
        type: 'function',
        function: {
          name: 'get_current_time',
          description: 'Get the current time',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      }
    ], {
      prompt: 'What time is it?'
    });
    
    console.log('✅ Tools work:', toolResponse.content || 'Tool called successfully');
    if (toolResponse.toolCalls) {
      console.log('🛠️ Tool calls:', toolResponse.toolCalls.length);
    }

    console.log('\n🎉 GPT-5 is working properly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGPT5().catch(console.error);
