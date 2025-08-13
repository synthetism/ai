/**
 * Test GPT-5 content generation issue
 */
const { AI } = require('./dist/ai.js');
const { readFileSync } = require('fs');

async function testGPT5Content() {
  console.log('🧪 Testing GPT-5 content generation...');
  
  const config = JSON.parse(readFileSync('private/openai.json', 'utf-8'));
  
  const ai = AI.openai({ 
    apiKey: config.apiKey,
    model: 'gpt-5'
  });

  try {
    // Test 1: Simple question (no tools)
    console.log('\n1. Simple question test...');
    const response1 = await ai.ask('What is 2+2? Explain your reasoning.');
    console.log('✅ Response content length:', response1.content.length);
    console.log('Content preview:', response1.content.slice(0, 100) + '...');
    console.log('Usage:', response1.usage);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGPT5Content().catch(console.error);
