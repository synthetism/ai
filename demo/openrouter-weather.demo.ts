/**
 * OpenRouter Weather AI Demo - Demonstrating Unit Architecture v1.0.6
 * 
 * This demo shows:
 * 1. AI unit learning weather capabilities through teach/learn paradigm
 * 2. Enhanced call() method using learned schemas automatically
 * 3. Real tool calling for weather data analysis with OpenRouter API
 * 4. Using openai/gpt-oss-20b model through OpenRouter
 */
import { readFileSync } from 'node:fs';
import { AI } from '../src/ai.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

const MODEL = 'openrouter/horizon-beta'; // Basic model as requested

async function openrouterWeatherDemo() {
  console.log('🌤️  OpenRouter Weather AI Demo - Unit Architecture v1.0.6\n');

  // Load real API keys
  const openrouterConfig = JSON.parse(
    readFileSync(path.join('private', 'openrouter.json'), 'utf-8')
  );

  const openweatherConfig = JSON.parse(
    readFileSync(path.join('private', 'openweather.json'), 'utf-8')
  );

  // 1. Create AI unit with OpenRouter backend using gpt-oss-20b
  const ai = AI.openrouter({ 
    apiKey: openrouterConfig.apiKey,
    model: MODEL
  });

  // 2. Create weather unit with real API key
  const weather = WeatherUnit.create({
    apiKey: openweatherConfig.apiKey,
    defaultUnits: 'metric'
  });

  console.log('📚 Learning weather capabilities...');
  
  // 3. AI learns weather capabilities (Unit Architecture magic)
  ai.learn([weather.teach()]);

  console.log(`✅ AI learned ${ai.schema().size()} weather tool schemas:`);
  for (const schema of ai.schema().list()) {
    console.log(`   • ${schema}`);
  }
  console.log();

  // 4. Use learned capabilities for intelligent weather analysis
  console.log('🤖 OpenRouter AI creating weather report using learned tools...\n');
  
  const prompt = `Create a comprehensive weather report comparing conditions in London, Paris, and Tokyo. 
Include current weather for each city and provide insights about temperature differences and recommendations for travelers.
Use the weather tools to get real data.`;

  try {
    const response = await ai.call(prompt, {
      useTools: true  // 🔥 Uses all learned schemas automatically
    });

    console.log('📊 Weather Report Generated via OpenRouter:');
    console.log('=' .repeat(50));
    console.log(response.content);
    console.log('=' .repeat(50));

    if (response.toolCalls) {
      console.log(`\n🛠️  Tool calls made: ${response.toolCalls.length}`);
      for (const call of response.toolCalls) {
        console.log(`   • ${call.function.name}(${JSON.stringify(call.function.arguments)})`);
      }
    }

    console.log(`\n💰 Usage: ${response.usage?.total_tokens || 'N/A'} tokens`);
    console.log(`🤖 Model: ${response.model || 'openai/gpt-oss-20b'}`);
    console.log(`🌐 Provider: ${response.provider}`);
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n🔧 This demo requires:');
    console.log('   • private/openrouter.json with { "apiKey": "sk-or-..." }');
    console.log('   • private/openweather.json with { "apiKey": "your-key" }');
  }

  // 5. Show what AI learned
  console.log('\n🧠 OpenRouter AI Unit Intelligence:');
  ai.help();
}

// Run demo
if (import.meta.url === `file://${process.argv[1]}`) {
  openrouterWeatherDemo().catch(console.error);
}

export { openrouterWeatherDemo };
