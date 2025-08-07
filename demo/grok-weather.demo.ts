/**
 * Grok Weather Demo - Testing conversational vs parallel tool calling
 * 
 * This demo shows:
 * 1. Grok AI learning the same weather capabilities 
 * 2. Testing if Grok follows Claude pattern (sequential) or OpenAI pattern (parallel)
 * 3. Measuring behavior and performance
 */
import { readFileSync } from 'node:fs';
import { AI } from '../src/ai.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function grokWeatherDemo() {
  console.log('🤖 Grok Weather Demo - Unit Architecture v1.0.6\n');

  // Load real API keys
  const grokConfig = JSON.parse(
    readFileSync(path.join('private', 'grok.json'), 'utf-8')
  );

  const openweatherConfig = JSON.parse(
       readFileSync(path.join('private', 'openweather.json'), 'utf-8')
 );

  // 1. Create AI unit with Grok backend
  const ai = AI.grok({ 
    apiKey: grokConfig.apiKey,
    model: 'grok-3-mini'  // Grok's main model
  });

  // 2. Create weather unit with mock data
  const weather = WeatherUnit.create({
    defaultUnits: 'metric',
    apiKey: openweatherConfig.apiKey  // Use real OpenWeather API key
  });

  console.log('📚 Grok learning weather capabilities...');
  
  // 3. AI learns weather capabilities (same as all other providers!)
  ai.learn([weather.teach()]);

  console.log(`✅ Grok learned ${ai.schema().size()} weather tool schemas:`);
  for (const schema of ai.schema().list()) {
    console.log(`   • ${schema}`);
  }
  console.log();

  // 4. Test tool calling behavior
  console.log('🤖 Grok creating weather report using learned tools...\n');
  console.log('🧪 TESTING: Will Grok follow Claude pattern (sequential) or OpenAI pattern (parallel)?\n');
  
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

    console.log('📊 Grok Weather Report Generated:');
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
      console.log('✅ PARALLEL BEHAVIOR - Made all 3 tool calls at once (like OpenAI/DeepSeek)');
    } else if (toolCallCount === 1) {
      console.log('⚠️  SEQUENTIAL BEHAVIOR - Made only 1 tool call (like Claude)');
    } else if (toolCallCount === 0) {
      console.log('❌ NO TOOL CALLS - Grok didn\'t use tools at all');
    } else {
      console.log(`🤔 PARTIAL BEHAVIOR - Made ${toolCallCount} tool calls (unexpected pattern)`);
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n🔧 This demo requires:');
    console.log('   • private/grok.json with { "apiKey": "xai-..." }');
    console.log('   • Grok API access from x.ai');
  }

  // 5. Show what Grok learned (same as any AI)
  console.log('\n🧠 Grok Unit Intelligence:');
  ai.help();
  
  console.log('\n🔥 Provider Comparison (Updated):');
  console.log('• OpenAI: Parallel tool calling, efficient batch execution');
  console.log('• DeepSeek: Parallel tool calling, excellent quality/value');
  console.log('• Claude: Sequential tool calling, careful step-by-step');
  console.log('• Grok: ? Testing now... (expects conversational pattern based on docs)');
}

// Run demo
if (import.meta.url === `file://${process.argv[1]}`) {
  grokWeatherDemo().catch(console.error);
}

export { grokWeatherDemo };
