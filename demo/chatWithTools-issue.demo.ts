/**
 * ChatWithTools Issue Demo - Isolating the Problem
 * 
 * This demo isolates the chatWithTools functionality to identify
 * the exact cause of the 422 error occurring in @synet/agent
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AIOperator } from '../src/ai.unit.js';
import { Weather, OpenWeather2 } from '@synet/weather';
import type { ChatMessage } from '../src/types.js';

async function runChatWithToolsDemo() {
  console.log('🔧 ChatWithTools Issue Demo');
  console.log('============================\n');

  try {
    // Step 1: Load API configuration
    console.log('🔑 Loading API configuration...');
    const openaiConfig = JSON.parse(
      readFileSync(path.join('private', 'openai.json'), 'utf-8')
    );
    
    const weatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );
    console.log('✅ Configuration loaded\n');

    // Step 2: Create AI operator
    console.log('🤖 Creating AI operator...');
    const ai = AIOperator.create({
      type: 'openai',
      options: {
        apiKey: openaiConfig.apiKey,
        model: 'gpt-4o-mini',
      },
    });
    console.log('✅ AI operator created\n');

    // Step 3: Create weather tool
    console.log('🌤️  Creating weather tool...');
    const openweather = new OpenWeather2({ 
      apiKey: weatherConfig.apiKey,
      timeout: 10000 
    });
    
    const weather = Weather.create({
      provider: openweather,
      defaultUnits: 'metric'
    });
    console.log('✅ Weather tool created\n');

    // Step 4: Teach AI the weather tool
    console.log('🧠 Teaching AI the weather tool...');
    ai.learn([weather.teach()]);
    console.log('✅ AI learned tools');
    console.log('Available capabilities:', ai.capabilities().list());
    console.log();

    // Step 5: Test simple chatWithTools call
    console.log('🔥 Testing simple chatWithTools call...');
    const simpleMessages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful weather assistant.' },
      { role: 'user', content: 'What is the weather in New York?' }
    ];

    console.log('Messages being sent:');
    console.log(JSON.stringify(simpleMessages, null, 2));
    console.log();

    const response1 = await ai.chatWithTools(simpleMessages);
    console.log('✅ Simple chatWithTools successful!');
    console.log('Response:', response1.content);
    console.log('Tool calls:', response1.toolCalls?.length || 0);
    console.log();

    // Step 6: Test multi-turn conversation (like Smith does)
    console.log('🔥 Testing multi-turn conversation...');
    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful weather assistant.' },
      { role: 'user', content: 'What is the weather in New York?' },
      { role: 'assistant', content: 'I\'ll check the weather in New York for you.' },
      { role: 'user', content: 'Now also check the weather in London.' }
    ];

    console.log('Multi-turn messages being sent:');
    console.log(JSON.stringify(conversationMessages, null, 2));
    console.log();

    const response2 = await ai.chatWithTools(conversationMessages);
    console.log('✅ Multi-turn chatWithTools successful!');
    console.log('Response:', response2.content);
    console.log('Tool calls:', response2.toolCalls?.length || 0);
    console.log();

    // Step 7: Test Smith-like conversation pattern
    console.log('🔥 Testing Smith-like conversation pattern...');
    const smithLikeMessages: ChatMessage[] = [
      { 
        role: 'system', 
        content: 'You are Agent Smith. Execute the mission by using available tools. Always use tools when appropriate.' 
      },
      { 
        role: 'user', 
        content: 'Mission: Get weather information for New York and save it to a file.' 
      },
      { 
        role: 'assistant', 
        content: 'I understand the mission. I need to get weather information for New York and save it to a file. Let me start by getting the weather data.' 
      },
      { 
        role: 'user', 
        content: 'Execute the next step: Get the weather for New York using the weather tool.' 
      }
    ];

    console.log('Smith-like messages being sent:');
    console.log(JSON.stringify(smithLikeMessages, null, 2));
    console.log();

    const response3 = await ai.chatWithTools(smithLikeMessages);
    console.log('✅ Smith-like chatWithTools successful!');
    console.log('Response:', response3.content);
    console.log('Tool calls:', response3.toolCalls?.length || 0);
    console.log();

    console.log('🎉 All chatWithTools tests passed! The issue might be in how Smith constructs the messages.');

  } catch (error) {
    console.error('❌ ChatWithTools demo failed:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Run demo
runChatWithToolsDemo().catch(console.error);
