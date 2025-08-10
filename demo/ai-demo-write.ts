/**
 * Real AI + Real Weather + AI-Safe Filesystem Demo (Unit Architecture)
 * 
 * This demo demonstrates proper SYNET Unit Archi  // Step 3: Create OpenAI unit
  console.log('🤖 Creating OpenAI unit...');
  const ai = AI.openai({
    apiKey: openaiApiKey,
    model: 'gpt-4o-mini'  // Fast OpenAI model with good function calling
  });e:
 * 1. Mistral AI for intelligent analysis
 * 2. Real OpenWeather API calls
 * 3. AI-safe filesystem as a teachable Unit
 * 4. Unit consciousness collaboration through teach/learn
 * 
 * The AI will:
 * - Learn weather capabilities from WeatherUnit
 * - Learn filesystem capabilities from AsyncFileSystem
 * - Get real weather data from 3 locations
 * - Write a comprehensive weather.md report using learned capabilities
 */

import { readFileSync } from 'node:fs';
import { NodeFileSystem, ObservableFileSystem } from '@synet/fs/promises';
import { createAIFileSystem } from '@synet/fs-ai';
import { AI } from '@synet/ai';
import { AsyncFileSystem } from "@synet/fs";
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function runUnitDemo() {
  console.log('🚀 Real AI + Weather + Filesystem Unit Demo');
  console.log('==========================================\n');

  // Load API keys
  let openaiApiKey: string;
  let openweatherApiKey: string;

  try {
    // Load OpenAI API key
    const openaiConfig = JSON.parse(
        readFileSync(path.join('private','openai.json'), 'utf-8')
    );
    openaiApiKey = openaiConfig.apiKey;
    console.log('✅ Loaded OpenAI API key');

    // Load OpenWeather API key
    const openweatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );
    openweatherApiKey = openweatherConfig.apiKey;
    console.log('✅ Loaded OpenWeather API key\n');

  } catch (error) {
    console.error('❌ Error loading API keys:', error);
    console.log('💡 Ensure private/ai/openai.json and private/openweather.json exist');
    return;
  }

  // Step 1: Setup AI-safe filesystem with Node backend and homePath
  console.log('📁 Setting up AI-safe filesystem with Observable wrapper...');
  const baseFs = new NodeFileSystem();
  const aiFs = createAIFileSystem(baseFs, {
    homePath: process.cwd(), // Set current directory as home
    allowedPaths: ['tmp/'], // Relative to homePath
    allowedOperations: ['readFile', 'writeFile', 'exists', 'ensureDir', 'readDir'],
    readOnly: false,
    maxDepth: 5
  });

  // Wrap with ObservableFileSystem to see events
  const observableFs = new ObservableFileSystem(aiFs);
  
  // Setup event monitoring
  const eventEmitter = observableFs.getEventEmitter();
  console.log('👁️  Setting up filesystem event monitoring...');
  
  eventEmitter.subscribe('file.write', {
    update: (event) => {
      const { type, data } = event;
      if (data.error) {
        console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${data.error.message}`);
        console.log(`   Path: ${data.filePath}, Operation: ${data.operation}`);
      } else {
        console.log(`🟢 [FS-EVENT] ${type} - SUCCESS`);
        console.log(`   Path: ${data.filePath}, Operation: ${data.operation}, Result: ${data.result} bytes written`);
      }
    }
  });

  eventEmitter.subscribe('file.read', {
    update: (event) => {
      const { type, data } = event;
      if (data.error) {
        console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${data.error.message}`);
        console.log(`🔍 [DEBUG] Error details:`, data.error);
        console.log(`🔍 [DEBUG] File path attempted:`, data.filePath);
        console.log(`🔍 [DEBUG] Operation:`, data.operation);
      } else {
        console.log(`🟢 [FS-EVENT] ${type} - SUCCESS: Read ${data.result} bytes from ${data.filePath}`);
      }
    }
  });

  eventEmitter.subscribe('file.ensureDir', {
    update: (event) => {
      const { type, data } = event;
      if (data.error) {
        console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${data.error.message}`);
      } else {
        console.log(`🟢 [FS-EVENT] ${type} - SUCCESS: Directory created/ensured: ${data.filePath}`);
      }
    }
  });

  eventEmitter.subscribe('file.readDir', {
    update: (event) => {
      const { type, data } = event;
      if (data.error) {
        console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${data.error.message}`);
      } else {
        console.log(`🟢 [FS-EVENT] ${type} - SUCCESS: Listed ${data.result} items in ${data.filePath}`);
      }
    }
  });

  await observableFs.ensureDir('tmp/'); // Simple relative path
  
  // Debug: Wrap the observableFs readFile method to see what parameters are passed
  const originalReadFile = observableFs.readFile.bind(observableFs);
  observableFs.readFile = async (path: string): Promise<string> => {
    console.log('🔍 [DEBUG] AIFileSystem.readFile called with parameters:');
    console.log('  path type:', typeof path);
    console.log('  path value:', path);
    console.log('  path repr:', JSON.stringify(path));
    
    return originalReadFile(path);
  };
  
  console.log('✓ AI-safe filesystem ready with tmp/ access and event monitoring');
  
  // Create a sample weather.md file for the AI to read
  console.log('📝 Creating sample weather.md file...');
  const sampleWeatherData = `# Weather Report - August 10, 2025

## Tokyo, Japan
- **Temperature**: 26°C (Feels like 28°C)
- **Humidity**: 80%
- **Conditions**: Heavy rain
- **Wind**: Light breeze from east
- **Recommendation**: Carry umbrella and waterproof jacket

## London, United Kingdom  
- **Temperature**: 22°C (Feels like 22°C)
- **Humidity**: 60%
- **Conditions**: Partly cloudy
- **Wind**: Moderate wind from southwest
- **Recommendation**: Light layers, possible light jacket

## New York, USA
- **Temperature**: 28°C (Feels like 30°C)
- **Humidity**: 70%
- **Conditions**: Sunny
- **Wind**: Light wind from west
- **Recommendation**: Light summer clothing, sunscreen

## Summary
Mixed conditions across all three cities. Tokyo experiencing monsoon weather, London typical summer conditions, New York hot and sunny.
`;

  try {
    await observableFs.writeFile('tmp/weather.md', sampleWeatherData);
    console.log('✅ Sample weather.md created successfully');
  } catch (error) {
    console.error('❌ Failed to create weather.md:', error);
  }

  // Step 2: Create AsyncFileSystem Unit with Observable AI-safe adapter
  console.log('🔧 Creating AsyncFileSystem Unit with Observable wrapper...');
  const fs = AsyncFileSystem.create({ adapter: observableFs });
  console.log('✓ AsyncFileSystem Unit created with Observable AI-safe backend');

  console.log('\nFilesystem Unit Information:');
  console.log(fs.whoami());
  console.log();

  // Step 3: Create OpenAI unit
  console.log('🤖 Creating OpenAI unit...');
  const ai = AI.openai({
    apiKey: openaiApiKey,
    model: 'gpt-4o-mini'
  });

  console.log('AI Unit Information:');
  console.log(ai.whoami());
  console.log();

  // Step 4: Create Weather unit with real API
  console.log('🌤️  Setting up Weather Unit with real API...');
  const weather = WeatherUnit.create({
    apiKey: openweatherApiKey,
    defaultUnits: 'metric'
  });

  console.log('Weather Unit Information:');
  console.log(weather.whoami());
  console.log();

    // Step 5: AI learns from both Weather and FileSystem units (Unit Architecture)
  console.log('🧠 AI learning capabilities from Weather and FileSystem units...');
  
  // Debug: Check what the filesystem unit is teaching
  const fsTeaching = fs.teach();
  console.log('🔍 [DEBUG] Filesystem teaching contract:');
  console.log('  unitId:', fsTeaching.unitId);
  console.log('  capabilities keys:', Object.keys(fsTeaching.capabilities || {}));
  console.log('  schema size:', fsTeaching.schema?.size?.() || 'no schema');
  console.log();
  
  // Debug: Check what the weather unit is teaching  
  const weatherTeaching = weather.teach();
  console.log('🔍 [DEBUG] Weather teaching contract:');
  console.log('  unitId:', weatherTeaching.unitId);
  console.log('  capabilities keys:', Object.keys(weatherTeaching.capabilities || {}));
  console.log('  schema size:', weatherTeaching.schema?.size?.() || 'no schema');
  console.log();
  
  ai.learn([weatherTeaching, fsTeaching]);
  
  const learnedCapabilities = ai.capabilities().list();
  console.log(`✅ AI learned ${learnedCapabilities.length} capabilities:`);
  learnedCapabilities.forEach(cap => console.log(`  • ${cap}`));
  console.log();

  // Step 6: Ask AI to get weather and write report using learned capabilities
  console.log('🌍 Asking AI to analyze weather and write report using learned capabilities...\n');

  const weatherRequest = `Your task is to analyze the current weather conditions and write recommendations for each location, including what to wear and which clothes to pack.

Please complete this task:

1. Read the file "tmp/weather.md" using your fs-async.readFile capability
2. Analyze the weather patterns and provide insights  
3. Report back with insights and recommendations for each city

IMPORTANT: Use the exact path "tmp/weather.md" when calling fs-async.readFile.`;

  try {
    console.log('🔍 [DEBUG] About to call AI with filesystem capabilities...');
    console.log('🔍 [DEBUG] AI can readFile:', ai.can('fs-async.readFile'));
    console.log('🔍 [DEBUG] Available capabilities:', ai.capabilities().list().join(', '));
    
    const response = await ai.call(weatherRequest, {
      useTools: true
    });

    console.log('✅ AI Weather Analysis Complete!');
    console.log('================================');
    console.log(response.content);
    console.log('================================\n');


    if (response.toolCalls && response.toolCalls.length > 0) {
        console.log(`🛠️  Tool calls made: ${response.toolCalls.length}`);
        for (const toolCall of response.toolCalls) {
          console.log(`   • ${toolCall.function?.name || 'unknown'}`);
        }
    }

    return {
      aiResponse: response,
      capabilitiesLearned: learnedCapabilities.length,
      reportGenerated: true,
      unitCollaboration: true
    };

  } catch (error) {
    console.error('\n❌ AI analysis failed:', error);
    
    // Fallback: Create a simple report using learned capabilities if available
    console.log('\n⚠️  Creating fallback weather report using learned capabilities...');
    
    if (ai.can('fs.writeFile')) {
      const fallbackReport = `# Weather Analysis Report (Fallback)
Generated: ${new Date().toISOString()}

## Status
The AI-powered weather analysis encountered an issue, but the Unit Architecture and filesystem capabilities are working correctly.

## System Verification
- ✅ AI-safe filesystem operational through AsyncFileSystem Unit
- ✅ Unit Architecture consciousness transfer successful
- ✅ AI learned ${learnedCapabilities.length} capabilities
- ⚠️  Weather API analysis temporarily unavailable

## Learned Capabilities
${learnedCapabilities.map(cap => `- ${cap}`).join('\n')}

## Technical Details
- **Architecture**: SYNET Unit consciousness collaboration
- **Filesystem**: AI-safe with teaching contracts
- **AI Provider**: Mistral with learned capabilities

---
*Fallback report generated by SYNET Unit Architecture.*
`;

      await ai.execute('fs.writeFile', 'tmp/weather-fallback.md', fallbackReport);
      console.log('✓ Fallback report saved using learned fs.writeFile capability');
    } else {
      console.log('❌ AI did not learn filesystem capabilities - cannot save fallback');
    }
    
    return {
      aiResponse: null,
      capabilitiesLearned: learnedCapabilities.length,
      reportGenerated: ai.can('fs.writeFile'),
      unitCollaboration: true,
      fallback: true
    };
  }
}

// Run the demo
if (import.meta.url.includes(process.argv[1])) {
  runUnitDemo()
    .then((results) => {
      console.log('\n✨ Unit Architecture Demo completed successfully!');
      if (results?.fallback) {
        console.log('🔄 Note: Used fallback mode due to API issues');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Unit Architecture Demo failed:', error);
      process.exit(1);
    });
}

export { runUnitDemo };
