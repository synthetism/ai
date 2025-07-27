/**
 * Simple Claude Tool Test - Debug tool calling
 */
import { readFileSync } from 'node:fs';
import { AI } from '../src/ai.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function simpleClaudeTest() {
  console.log('🧪 Simple Claude Tool Test\n');

  const anthropicConfig = JSON.parse(
    readFileSync(path.join('private', 'anthropic.json'), 'utf-8')
  );

  const ai = AI.claude({ 
    apiKey: anthropicConfig.apiKey,
    model: 'claude-3-5-sonnet-20241022'
  });

  const weather = WeatherUnit.create({
    apiKey: 'mock-key' // Use mock data
  });

  ai.learn([weather.teach()]);

  console.log('🤖 Trying very direct tool request...\n');

  const response = await ai.call('Call the getCurrentWeather function for London right now.', {
    useTools: true
  });

  console.log('Response:', response.content);
  console.log('Tool calls made:', response.toolCalls?.length || 0);
  
  if (response.toolCalls) {
    for (const call of response.toolCalls) {
      console.log(`Tool: ${call.function.name}`);
      console.log(`Args: ${JSON.stringify(call.function.arguments)}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  simpleClaudeTest().catch(console.error);
}
