/**
 * Gemini Weather Demo - Testing Google's AI with function calling
 * 
 * This demo shows:
 * 1. Gemini AI learning the same weather capabilities 
 * 2. Testing Gemini's unique API format with function calling
 * 3. Completing our comprehensive AI provider comparison
 */
import { readFileSync } from 'node:fs';
import { AI } from '../src/ai.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function geminiWeatherDemo() {
  console.log('🔮 Gemini Weather Demo - Unit Architecture v1.0.6\n');

  // Load real API keys
  const geminiConfig = JSON.parse(
    readFileSync(path.join('private', 'gemini.json'), 'utf-8')
  );

  const openweatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
  );

  // 1. Create AI unit with Gemini backend
  const ai = AI.gemini({ 
    apiKey: geminiConfig.apiKey,
    model: 'gemini-1.5-flash'  // Gemini's fast model
  });

  // 2. Create weather unit with mock data
  const weather = WeatherUnit.create({
    defaultUnits: 'metric',
    apiKey: openweatherConfig.apiKey
  });

  console.log('📚 Gemini learning weather capabilities...');
  
  // 3. AI learns weather capabilities (same as all other providers!)
  ai.learn([weather.teach()]);

  console.log(`✅ Gemini learned ${ai.schemas().length} weather tool schemas:`);
  for (const schema of ai.schemas()) {
    console.log(`   • ${schema}`);
  }
  console.log();

  // 4. Test tool calling behavior
  console.log('🤖 Gemini creating weather report using learned tools...\n');
  console.log('🧪 TESTING: How will Gemini handle function calling with its unique API format?\n');
  
  const prompt = `You are a weather assistant with access to weather tools. Create a comprehensive weather report comparing conditions in London, Paris, and Tokyo.

INSTRUCTIONS:
1. Use weather_getCurrentWeather tool to get current weather for ALL THREE cities: London, Paris, and Tokyo
2. Compare temperature differences and provide travel recommendations
3. You MUST call the weather tools to get real data for ALL cities

Please be efficient and call all the tools you need.`;

  const startTime = Date.now();

  try {
    const response = await ai.call(prompt, {
      useTools: true  // 🔥 Same Unit capabilities, different AI provider
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('📊 Gemini Weather Report Generated:');
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
    console.log(`⏱️  Duration: ${duration}ms`);
    
    // Analyze behavior
    console.log('\n🧪 BEHAVIOR ANALYSIS:');
    console.log('================================');
    
    const toolCallCount = response.toolCalls?.length || 0;
    if (toolCallCount === 3) {
      console.log('✅ PARALLEL BEHAVIOR - Made all 3 tool calls at once (like OpenAI/DeepSeek/Grok)');
    } else if (toolCallCount === 1) {
      console.log('⚠️  SEQUENTIAL BEHAVIOR - Made only 1 tool call (like Claude)');
    } else if (toolCallCount === 0) {
      console.log('❌ NO TOOL CALLS - Gemini didn\'t use tools at all');
    } else {
      console.log(`🤔 PARTIAL BEHAVIOR - Made ${toolCallCount} tool calls (unexpected pattern)`);
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n🔧 This demo requires:');
    console.log('   • private/gemini.json with { "apiKey": "AIza..." }');
    console.log('   • Google AI API access from console.cloud.google.com');
  }

  // 5. Show what Gemini learned (same as any AI)
  console.log('\n🧠 Gemini Unit Intelligence:');
  ai.help();
  
  console.log('\n🔥 FINAL Provider Comparison:');
  console.log('• OpenAI: Parallel tool calling, efficient batch execution, expensive');
  console.log('• DeepSeek: Parallel tool calling, excellent quality/value ratio');
  console.log('• Grok: Parallel tool calling, detailed reports, cheapest but slower');
  console.log('• Claude: Sequential tool calling, incomplete execution, disappointing');
  console.log('• Gemini: ? Testing now... (Google\'s unique API format)');
}

// Run demo
if (import.meta.url === `file://${process.argv[1]}`) {
  geminiWeatherDemo().catch(console.error);
}

export { geminiWeatherDemo };
