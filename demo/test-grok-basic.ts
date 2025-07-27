import { AI } from '../src/ai.js';
import { readFileSync } from 'node:fs';

async function testGrokBasic() {
  const config = JSON.parse(readFileSync('./private/grok.json', 'utf-8'));
  const ai = AI.grok({ apiKey: config.apiKey });

  try {
    console.log('🧪 Testing basic Grok functionality...');
    const response = await ai.ask('What is 2+2? Answer briefly.');
    console.log('✅ Grok basic ask works!');
    console.log('Response:', response.content);
    console.log('Model:', response.model);
    console.log('Provider:', response.provider);
    console.log('Usage:', response.usage);
  } catch (error) {
    console.log('❌ Grok ask failed:', error.message);
    console.log('Error details:', error);
  }
}

testGrokBasic();
