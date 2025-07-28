/**
 * Amazon Nova Demo - Testing AWS Bedrock Nova models
 * 
 * This demo shows:
 * 1. AI unit using Amazon Nova Pro through Bedrock
 * 2. Simple question answering
 * 3. Weather unit integration with Nova
 */
import { readFileSync } from 'node:fs';
import { AI } from '../src/ai.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function novaDemo() {
  console.log('🚀 Amazon Nova Demo - AWS Bedrock Integration\n');

  // Load API keys
  const bedrockConfig = JSON.parse(
    readFileSync(path.join('private', 'bedrock.json'), 'utf-8')
  );

  const openweatherConfig = JSON.parse(
    readFileSync(path.join('private', 'openweather.json'), 'utf-8')
  );

  // 1. Create AI unit with Nova Pro
  const ai = AI.bedrock({
    apiKey: bedrockConfig.apiKey,
    model: 'amazon.nova-pro-v1:0',
    region: 'us-east-1'
  });

  console.log('🤖 AI Unit Information:');
  console.log(ai.whoami());
  console.log();

  // 2. Test basic conversation
  console.log('💬 Testing basic Nova conversation...');
  try {
    const response = await ai.ask('What is Amazon Nova? Please be concise.');
    console.log('✅ Nova response:');
    console.log(`   ${response.content}`);
    console.log(`   Model: ${response.model}`);
    console.log(`   Provider: ${response.provider}`);
    if (response.usage) {
      console.log(`   Tokens: ${response.usage.prompt_tokens} → ${response.usage.completion_tokens}`);
    }
    console.log();
  } catch (error) {
    console.error('❌ Error with Nova:', error);
    return;
  }

  // 3. Create weather unit and test integration
  console.log('🌤️  Testing Nova + Weather Unit integration...');
  try {
    const weather = WeatherUnit.create({
      apiKey: openweatherConfig.apiKey,
      defaultUnits: 'metric'
    });

    // AI learns weather capabilities
    ai.learn([weather.teach()]);

    console.log(`✅ AI learned ${ai.schemas().length} weather tools:`);
    for (const schema of ai.schemas()) {
      console.log(`   • ${schema}`);
    }
    console.log();

    // Test Nova with weather tools
    console.log('🤖 Nova creating intelligent weather analysis...\n');
    
    const weatherResponse = await ai.call('Compare the weather in Tokyo and London today. What would you recommend for travelers?', {
      useTools: true
    });

    console.log('✅ Nova weather analysis:');
    console.log('==================================================');
    console.log(weatherResponse.content);
    console.log('==================================================');
    console.log();

    if (weatherResponse.toolCalls && weatherResponse.toolCalls.length > 0) {
      console.log(`🛠️  Tool calls made: ${weatherResponse.toolCalls.length}`);
      for (const toolCall of weatherResponse.toolCalls) {
        console.log(`   • ${toolCall.function?.name || 'unknown'}`);
      }
    }

    if (weatherResponse.usage) {
      console.log(`💰 Usage: ${weatherResponse.usage.total_tokens} tokens`);
    }

  } catch (error) {
    console.error('❌ Error with Nova + Weather:', error);
  }

  // 4. Test Nova Lite for comparison
  console.log('\n🌟 Testing Nova Lite for comparison...');
  try {
    const aiLite = AI.presets.novaLite(bedrockConfig.apiKey);
    
    const liteResponse = await aiLite.ask('Explain quantum computing in one sentence.');
    console.log('✅ Nova Lite response:');
    console.log(`   ${liteResponse.content}`);
    console.log(`   Model: ${liteResponse.model}`);
    
    if (liteResponse.usage) {
      console.log(`   Tokens: ${liteResponse.usage.prompt_tokens} → ${liteResponse.usage.completion_tokens}`);
    }
    console.log();
  } catch (error) {
    console.error('❌ Error with Nova Lite:', error);
  }

  console.log('🎉 Amazon Nova Demo Complete!');
  console.log('\n💡 Nova models are now available via:');
  console.log('   • AI.bedrock({ apiKey, model: "amazon.nova-pro-v1:0" })');
  console.log('   • AI.presets.nova(apiKey)');
  console.log('   • AI.presets.novaLite(apiKey)');
}

// Run demo
novaDemo().catch(console.error);
