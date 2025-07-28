/**
 * Bedrock Weather Demo - Testing AWS Bedrock Models with Weather Tools
 * 
 * This demo shows:
 * 1. AI unit using multiple Amazon models through AWS Bedrock
 * 2. Testing Nova Pro, Nova Lite, and other Bedrock models
 * 3. Weather unit integration with different models
 */
import { readFileSync } from 'node:fs';
import { AI } from '../src/ai.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function bedrockWeatherDemo() {
  console.log('🚀 AWS Bedrock Multi-Model Demo - Testing Various Bedrock Models + Weather Tools\n');

  // Load AWS Bedrock credentials and openweather config
  let bedrockApiKey: string;
  let openweatherApiKey: string;
  let region: string;

  try {
    // Load AWS Bedrock credentials
    const bedrockConfig = JSON.parse(
      readFileSync(path.join('private', 'bedrock.json'), 'utf-8')
    );
    bedrockApiKey = bedrockConfig.apiKey;
    region = bedrockConfig.region || 'us-east-1'; // Default to us-east-1
    console.log('✅ Loaded AWS Bedrock API key');

    // Try to load OpenWeather config
    try {
      const openweatherConfig = JSON.parse(
        readFileSync(path.join('private', 'openweather.json'), 'utf-8')
      );
      openweatherApiKey = openweatherConfig.apiKey;
      console.log('✅ Loaded OpenWeather API key');
    } catch {
      console.log('⚠️  No OpenWeather config found - using mock weather data');
      openweatherApiKey = 'demo-key'; // Will use mock responses
    }
  } catch (error) {
    console.error('❌ Error loading API keys:', error);
    console.log('💡 Create private/bedrock.json with your AWS credentials');
    return;
  }

  // 1. Create AI unit via AWS Bedrock
  console.log('🤖 Creating Bedrock AI unit...');
  
  const ai = AI.bedrock({
    apiKey: bedrockApiKey,
    model: 'amazon.nova-pro-v1:0',
    region: region
  });

  console.log('AI Unit Information:');
  console.log(ai.whoami());
  console.log();

  // 2. Test basic Bedrock conversation
  console.log('💬 Testing Bedrock model response...');

  try {
    const response = await ai.ask('What is your current model? Be concise.');
    console.log('✅ Bedrock response:');
    console.log(`   ${response.content}`);
    console.log(`   Model: ${response.model}`);
    console.log(`   Provider: ${response.provider}`);
    if (response.usage) {
      console.log(`   Tokens: ${response.usage.prompt_tokens} → ${response.usage.completion_tokens}`);
    }
    console.log();
  } catch (error) {
    console.error('❌ Error with Bedrock model:', error);
    return;
  }

  // 3. Create weather unit and integrate
  console.log('🌤️  Setting up Weather Unit integration...');
  try {
    const weather = WeatherUnit.create({
      apiKey: openweatherApiKey, 
      defaultUnits: 'metric'
    });

    // AI learns weather capabilities
    ai.learn([weather.teach()]);

    console.log(`✅ Bedrock AI learned ${ai.schemas().length} weather tools:`);
    for (const schema of ai.schemas()) {
      console.log(`   • ${schema}`);
    }
    console.log();

    // 4. Test Bedrock model with weather tools
    console.log('🌍 Bedrock AI analyzing weather patterns...\n');
    
    const weatherQuery = 'What is the current weather in Tokyo? Please provide temperature, conditions, and a brief recommendation for outdoor activities.';
    
    const weatherResponse = await ai.call(weatherQuery, {
      useTools: true
    });

    console.log('✅ Bedrock + Weather Analysis:');
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
      console.log(`   Input: ${weatherResponse.usage.prompt_tokens}`);
      console.log(`   Output: ${weatherResponse.usage.completion_tokens}`);
    }
    console.log();

    // 5. Compare multiple cities
    console.log('🌏 Bedrock AI comparing weather across cities...\n');
    
    const comparisonQuery = 'Compare the weather in London, Tokyo, and New York. Which city has the best weather today for tourism?';
    
    const comparisonResponse = await ai.call(comparisonQuery, {
      useTools: true
    });

    console.log('✅ Multi-City Weather Comparison:');
    console.log('==================================================');
    console.log(comparisonResponse.content);
    console.log('==================================================');
    console.log();

    if (comparisonResponse.toolCalls) {
      console.log(`🛠️  Cities analyzed: ${comparisonResponse.toolCalls.length}`);
    }

    if (comparisonResponse.usage) {
      console.log(`💰 Total usage: ${comparisonResponse.usage.total_tokens} tokens`);
    }

  } catch (error) {
    console.error('❌ Error with Bedrock + Weather:', error);
  }

  console.log('\n🎉 Bedrock Weather Demo Complete!');
  console.log('\n💡 Bedrock model successfully integrated with:');
  console.log('   • AWS Bedrock Runtime API');
  console.log('   • SYNET Unit Architecture');
  console.log('   • Weather Unit tool calling');
  console.log('   • Real-time weather data integration');
}

// Run demo
bedrockWeatherDemo().catch(console.error);
