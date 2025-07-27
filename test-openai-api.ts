/**
 * Simple OpenAI API Test - Direct API call without SYNET architecture
 * 
 * This tests the raw OpenAI API to verify credentials and connectivity
 */

import { readFileSync } from 'node:fs';

// Load credentials
const openaiConfig = JSON.parse(
  readFileSync('/Users/helios/Dev/synet/packages/ai/private/openai.json', 'utf-8')
);

console.log('🔍 Direct OpenAI API Test\n');

async function testOpenAIAPI() {
  const apiKey = openaiConfig.apiKey;
  
  console.log('📋 Configuration:');
  console.log(`   API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('   Endpoint: https://api.openai.com/v1/chat/completions');
  console.log();

  // Test 1: Simple completion
  console.log('🧪 Test 1: Simple Chat Completion');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'What is 2+2? Answer with just the number.' }
        ],
        max_tokens: 10
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success!`);
      console.log(`   Response: "${data.choices[0].message.content}"`);
      console.log(`   Tokens: ${data.usage.total_tokens}`);
      console.log(`   Model: ${data.model}`);
    } else {
      const errorData = await response.text();
      console.log(`   ❌ Failed: ${errorData}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log();

  // Test 2: Model listing
  console.log('🧪 Test 2: List Models (Connection Test)');
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success!`);
      console.log(`   Available models: ${data.data.length}`);
      const gptModels = data.data.filter(m => m.id.includes('gpt')).map(m => m.id);
      console.log(`   GPT models: ${gptModels.slice(0, 3).join(', ')}...`);
    } else {
      const errorData = await response.text();
      console.log(`   ❌ Failed: ${errorData}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log();

  // Test 3: Tool calling
  console.log('🧪 Test 3: Tool Calling Test');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Use the calculator to add 15 and 25' }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'calculator_add',
              description: 'Add two numbers',
              parameters: {
                type: 'object',
                properties: {
                  a: { type: 'number', description: 'First number' },
                  b: { type: 'number', description: 'Second number' }
                },
                required: ['a', 'b']
              }
            }
          }
        ],
        tool_choice: 'auto'
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success!`);
      console.log(`   Response: "${data.choices[0].message.content || 'No content'}"`);
      if (data.choices[0].message.tool_calls) {
        console.log(`   Tool calls: ${data.choices[0].message.tool_calls.length}`);
        data.choices[0].message.tool_calls.forEach(call => {
          console.log(`     - ${call.function.name}(${call.function.arguments})`);
        });
      }
      console.log(`   Tokens: ${data.usage.total_tokens}`);
    } else {
      const errorData = await response.text();
      console.log(`   ❌ Failed: ${errorData}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log();

  console.log('📊 Test Summary');
  console.log('================');
  console.log('If all tests passed, the API key and connection are working.');
  console.log('If tests failed, check:');
  console.log('  - API key validity');
  console.log('  - Network connection');
  console.log('  - OpenAI service status');
}

// Run the test
testOpenAIAPI().catch(console.error);
