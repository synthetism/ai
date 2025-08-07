/**
 * DeepSeek Weather Demo - Same Unit capabilities, different AI provider
 * 
 * This demo shows:
 * 1. DeepSeek AI learning the same weather capabilities 
 * 2. Same Unit Architecture patterns with different provider
 * 3. OpenAI-compatible API working seamlessly
 */
import { readFileSync } from 'node:fs';
import { AI } from '../src/ai.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function deepseekWeatherDemo() {
  console.log('🧠 DeepSeek Weather Demo - Unit Architecture v1.0.6\n');

  // Load real API keys (create private/deepseek.json with your API key)
  const deepseekConfig = JSON.parse(
    readFileSync(path.join('private', 'deepseek.json'), 'utf-8')
  );

  const openweatherConfig = JSON.parse(
        readFileSync(path.join('private', 'openweather.json'), 'utf-8')
  );

  // 1. Create AI unit with DeepSeek backend
  const ai = AI.deepseek({ 
    apiKey: deepseekConfig.apiKey,
    model: 'deepseek-chat'  // DeepSeek's main model
  });

  // 2. Create weather unit with mock data (no API key needed)
  const weather = WeatherUnit.create({
    defaultUnits: 'metric',
    apiKey: openweatherConfig.apiKey  // Use real OpenWeather API key
  });

  console.log('📚 DeepSeek learning weather capabilities...');
  
  // 3. AI learns weather capabilities (same as OpenAI/Claude demo!)
  ai.learn([weather.teach()]);

  console.log(`✅ DeepSeek learned ${ai.schema().list().length} weather tool schemas:`);
  for (const schema of ai.schema().list()) {
    console.log(`   • ${schema}`);
  }
  console.log();

  // 4. Use learned capabilities for intelligent weather analysis
  console.log('🤖 DeepSeek creating weather report using learned tools...\n');
  
  const prompt = `You are a weather assistant with access to weather tools. Create a comprehensive weather report comparing conditions in London, Paris, and Tokyo.

INSTRUCTIONS:
1. Use weather_getCurrentWeather tool to get current weather for each city
2. Compare temperature differences and provide travel recommendations
3. You MUST call the weather tools to get real data

Be thorough and call the tools for all three cities.`;

  try {
    const response = await ai.call(prompt, {
      useTools: true  // 🔥 Same Unit capabilities, different AI provider
    });

    console.log('📊 DeepSeek Weather Report Generated:');
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
    console.log('✓ Only difference: AI.deepseek() vs AI.openai() vs AI.claude()');
    console.log('✓ OpenAI-compatible API works seamlessly');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n🔧 This demo requires:');
    console.log('   • private/deepseek.json with { "apiKey": "sk-..." }');
    console.log('   • Create DeepSeek account at https://platform.deepseek.com/');
  }

  // 5. Show what DeepSeek learned (same as any AI)
  console.log('\n🧠 DeepSeek Unit Intelligence:');
  ai.help();
  
  console.log('\n🔥 Provider Comparison:');
  console.log('• OpenAI: Parallel tool calling, efficient batch execution');
  console.log('• Claude: Sequential tool calling, careful step-by-step');
  console.log('• DeepSeek: ? Let\'s find out! (OpenAI-compatible behavior expected)');
}

// Run demo
if (import.meta.url === `file://${process.argv[1]}`) {
  deepseekWeatherDemo().catch(console.error);
}

export { deepseekWeatherDemo };
