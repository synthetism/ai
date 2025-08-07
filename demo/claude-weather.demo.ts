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

  // 2. Create weather unit with mock data (no API key needed)
  const weather = WeatherUnit.create({
    defaultUnits: 'metric',
    apiKey: openweatherConfig.apiKey  // Use real OpenWeather API key
  });

  console.log('📚 Claude learning weather capabilities...');
  
  // 3. AI learns weather capabilities (same as OpenAI demo!)
  ai.learn([weather.teach()]);

  console.log(`✅ Claude learned ${ai.schema().size()} weather tool schemas:`);
  for (const schema of ai.schema().list()) {
    console.log(`   • ${schema}`);
  }
  console.log();

  // 4. Use learned capabilities for intelligent weather analysis
  console.log('🤖 Claude creating weather report using learned tools...\n');
  
  const prompt = `You are a weather assistant with access to weather tools. You MUST use the available weather tools to get actual weather data.

Task: Create a comprehensive weather report comparing conditions in London, Paris, and Tokyo.

INSTRUCTIONS:
1. Use weather_getCurrentWeather tool to get current weather for London
2. Use weather_getCurrentWeather tool to get current weather for Paris  
3. Use weather_getCurrentWeather tool to get current weather for Tokyo
4. Compare the temperature differences and provide travel recommendations

You MUST call the weather tools - do not provide fictional weather data.`;

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

    // Debug: Show full response structure
    console.log('\n🔍 Debug - Full Response:');
    console.log('Content type:', typeof response.content);
    console.log('Content length:', response.content?.length);
    console.log('Tool calls:', response.toolCalls?.length || 0);
    console.log('Raw response object keys:', Object.keys(response));

    console.log(`\n💰 Usage: ${response.usage?.total_tokens || 'N/A'} tokens`);
    
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
