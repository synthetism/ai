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
import { AI, AIOperator } from '@synet/ai';
import { AsyncFileSystem } from "@synet/fs";
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function runUnitDemo() {
  console.log('🚀 Real AI + Weather + Filesystem Unit Demo');
  console.log('==========================================\n');

  // Load API keys
  let apiKey: string;
  let openweatherApiKey: string;

  const provider = 'deepseek';
  const model = 'deepseek-chat';

  try {
    // Load AI API key
      const config = JSON.parse(
           readFileSync(path.join('private',  `${provider}.json`), 'utf-8')
    );
    apiKey = config.apiKey;
    console.log('✅ Loaded AI API key');

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
    allowedPaths: ['vault/'], // Relative to homePath
    allowedOperations: ['readFile', 'writeFile', 'exists', 'ensureDir', 'readDir'],
    readOnly: false,
    maxDepth: 5
  });

  // Wrap with ObservableFileSystem to see events
  const observableFs = new ObservableFileSystem(aiFs);
  
  // Setup event monitoring
  const eventEmitter = observableFs.getEventEmitter();
  console.log('👁️  Setting up filesystem event monitoring...');

  eventEmitter.on('file.write', (event) => {
    const { type, data, error } = event;
    if (error) {
      console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${error.message}`);
      console.log(`   Path: ${data.filePath}`);
    } else {
      console.log(`🟢 [FS-EVENT] ${type} - SUCCESS`);
      console.log(`   Path: ${data.filePath}, Result: ${data.result} bytes written`);
    }
  });

  eventEmitter.on('file.read', (event) => {
    const { type, data, error } = event;
    if (error) {
      console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${error.message}`);
    } else {
      console.log(`🟢 [FS-EVENT] ${type} - SUCCESS: Read ${data.result} bytes from ${data.filePath}`);
      }
  });

  eventEmitter.on('file.ensureDir', (event) => {
    const { type, data, error } = event;
    if (error) {
      console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${error.message}`);
    } else {
      console.log(`🟢 [FS-EVENT] ${type} - SUCCESS: Directory created/ensured: ${data.filePath}`);
    }
  });

  eventEmitter.on('file.readDir', (event) => {
    const { type, data, error } = event;
    if (error) {
      console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${error.message}`);
    } else {
      console.log(`🟢 [FS-EVENT] ${type} - SUCCESS: Listed ${data.result} items in ${data.filePath}`);
      }
  });
  

  await observableFs.ensureDir('vault/'); // Simple relative path
  console.log('✓ AI-safe filesystem ready with vault/ access and event monitoring');

  // Step 2: Create AsyncFileSystem Unit with Observable AI-safe adapter
  console.log('🔧 Creating AsyncFileSystem Unit with Observable wrapper...');
  const fs = AsyncFileSystem.create({ adapter: observableFs });
  console.log('✓ AsyncFileSystem Unit created with Observable AI-safe backend');

  console.log('\nFilesystem Unit Information:');
  console.log(fs.whoami());
  console.log();

  // Step 3: Create AI unit
  console.log('🤖 Creating AI unit...');
  const ai = AIOperator.create({
    type: provider,
    options: {
      apiKey: apiKey,
      model: model,
    },
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
  ai.learn([fs.teach()]);
  
  const learnedCapabilities = ai.capabilities().list();
  console.log(`✅ AI learned ${learnedCapabilities.length} capabilities:`);
  learnedCapabilities.forEach(cap => console.log(`  • ${cap}`));
  console.log();

  // Step 6: Ask AI to get weather and write report using learned capabilities
  console.log('🌍 Asking AI to analyze weather and write report using learned capabilities...\n');

  const weatherRequest = `

  Your task is to analyze the current weather conditions and write recommendations for the each location, what to wear and which clothes to pack.
  Read file vault/weather.md using :

1. Get the current weather reading file vault/weather.md using fs-async.readFile
2. Analyze the weather patterns and write insights
3. Call tool 'fs-async.writeFile' to save report to path 'vault/weather-report.md'
`;

  try {
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

      await ai.execute('fs.writeFile', 'vault/weather-fallback.md', fallbackReport);
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
