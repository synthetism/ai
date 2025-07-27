/**
 * Claude Weather Demo - Same Unit capabilities, different AI provider
 * 
 * This demo shows:
 * 1. Claude AI learning the same weather capabilities 
 * 2. Same Unit Architecture patterns with different provider
 * 3. Real API calls demonstrating format adaptation
 */
import { readFileSync } from 'node:fs';
import { AI } from '../src/ai.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function claudeWeatherDemo() {
  console.log('🧠 Claude Weather Demo - Unit Architecture v1.0.6\n');

  // Load real API keys
  const anthropicConfig = JSON.parse(
    readFileSync(path.join('private', 'anthropic.json'), 'utf-8')
  );

  const openweatherConfig = JSON.parse(
    readFileSync(path.join('private', 'openweather.json'), 'utf-8')
  );

  // 1. Create AI unit with Claude backend
  const ai = AI.claude({ 
    apiKey: anthropicConfig.apiKey,
    model: 'claude-3-5-sonnet-20241022'
  });

  // 2. Create weather unit with real API key
  const weather = WeatherUnit.create({
    apiKey: openweatherConfig.apiKey,
    defaultUnits: 'metric'
  });

  console.log('📚 Claude learning weather capabilities...');
  
  // 3. AI learns weather capabilities (same as OpenAI demo!)
  ai.learn([weather.teach()]);

  console.log(`✅ Claude learned ${ai.schemas().length} weather tool schemas:`);
  for (const schema of ai.schemas()) {
    console.log(`   • ${schema}`);
  }
  console.log();

  // 4. Use learned capabilities for intelligent weather analysis
  console.log('🤖 Claude creating weather report using learned tools...\n');
  
  const prompt = `Create a comprehensive weather report comparing conditions in London, Paris, and Tokyo. 
Include current weather for each city and provide insights about temperature differences and recommendations for travelers.
You MUST use the weather tools to get real data. Call getCurrentWeather for each city: London, Paris, and Tokyo.`;

  try {
    const response = await ai.call(prompt, {
      useTools: true  // 🔥 Same Unit capabilities, different AI provider
    });

    console.log('📊 Claude Weather Report Generated:');
    console.log('=' .repeat(60));
    console.log(response.content);
    console.log('=' .repeat(60));

    if (response.toolCalls) {
      console.log(`\n🛠️  Tool calls made: ${response.toolCalls.length}`);
      for (const call of response.toolCalls) {
        console.log(`   • ${call.function.name}(${JSON.stringify(call.function.arguments)})`);
      }
    }

    console.log(`\n💰 Usage: ${response.usage?.total_tokens || 'N/A'} tokens`);
    
    // Show the scary simplicity
    console.log('\n🎯 The Revolutionary Part:');
    console.log('================================');
    console.log('✓ Same WeatherUnit.teach() contract');
    console.log('✓ Same ai.learn() and ai.call() API');
    console.log('✓ Same Unit capabilities across providers');
    console.log('✓ Only difference: AI.claude() vs AI.openai()');
    console.log('✓ Tool format adaptation handled automatically');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n🔧 This demo requires:');
    console.log('   • private/anthropic.json with { "apiKey": "sk-ant-..." }');
    console.log('   • private/openweather.json with { "apiKey": "your-key" }');
  }

  // 5. Show what Claude learned (same as any AI)
  console.log('\n🧠 Claude Unit Intelligence:');
  ai.help();
}

// Run demo
if (import.meta.url === `file://${process.argv[1]}`) {
  claudeWeatherDemo().catch(console.error);
}

export { claudeWeatherDemo };
