/**
 * Weather AI Demo - Demonstrating Unit Architecture v1.0.6
 * 
 * This demo shows:
 * 1. AI unit learning weather capabilities through teach/learn paradigm
 * 2. Enhanced call() method using learned schemas automatically
 * 3. Real tool calling for weather data analysis
 */
import { readFileSync } from 'node:fs';
import { AI } from '../src/ai.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function weatherDemo() {
  console.log('🌤️  Weather AI Demo - Unit Architecture v1.0.6\n');

  const openaiConfig = JSON.parse(
    readFileSync(path.join('private', 'openai.json'), 'utf-8')
  );

  // 1. Create AI unit with OpenAI backend
  const ai = AI.openai({ 
    apiKey: openaiConfig.apiKey || 'demo-key',
    model: 'gpt-4o-mini'
  });

  // 2. Create weather unit (will use mock data without API key)
  const weather = WeatherUnit.create({
    defaultUnits: 'metric'
  });

  console.log('📚 Learning weather capabilities...');
  
  // 3. AI learns weather capabilities (Unit Architecture magic)
  ai.learn([weather.teach()]);

  console.log(`✅ AI learned ${ai.schemas().length} weather tool schemas:`);
  ai.schemas().forEach(schema => console.log(`   • ${schema}`));
  console.log();

  // 4. Use learned capabilities for intelligent weather analysis
  console.log('🤖 AI creating weather report using learned tools...\n');
  
  const prompt = `Create a comprehensive weather report comparing conditions in London, Paris, and Tokyo. 
Include current weather for each city and provide insights about temperature differences and recommendations for travelers.
Use the weather tools to get real data.`;

  try {
    const response = await ai.call(prompt, {
      useTools: true  // 🔥 Uses all learned schemas automatically
    });

    console.log(response);

    console.log('📊 Weather Report Generated:');
    console.log('=' .repeat(50));
    console.log(response.content);
    console.log('=' .repeat(50));

    if (response.toolCalls) {
      console.log(`\n🛠️  Tool calls made: ${response.toolCalls.length}`);
      response.toolCalls.forEach(call => {
        console.log(`   • ${call.function.name}(${JSON.stringify(call.function.arguments)})`);
      });
    }

    console.log(`\n💰 Usage: ${response.usage?.total_tokens || 'N/A'} tokens`);
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n🔧 This demo requires OPENAI_API_KEY environment variable');
    console.log('   Without it, you can still see the learning and schema setup working!');
  }

  // 5. Show what AI learned
  console.log('\n🧠 AI Unit Intelligence:');
  ai.help();
}

// Run demo
if (import.meta.url === `file://${process.argv[1]}`) {
  weatherDemo().catch(console.error);
}

export { weatherDemo };
