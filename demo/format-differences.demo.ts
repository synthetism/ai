/**
 * Format Differences Demo
 * 
 * Shows how the same weather capabilities work across different AI providers
 * and demonstrates the tool format adaptation layer.
 */

import { AIOperator as AI } from '../src/ai.unit.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';

async function demonstrateFormatDifferences() {
  console.log('🌤️  AI Provider Format Differences Demo\n');

  // Create weather unit
  const weather = WeatherUnit.create({
    apiKey: process.env.OPENWEATHER_API_KEY || 'demo-key'
  });

  // Create different AI providers
  const providers = [
    {
      name: 'OpenAI GPT-4',
      ai: AI.create({ 
        type: 'openai' as const, 
        options: { 
          apiKey: process.env.OPENAI_API_KEY || '',
          model: 'gpt-4o-mini'
        } 
      })
    },
    {
      name: 'Claude 3.5 Sonnet',
      ai: AI.create({ 
        type: 'claude' as const, 
        options: { 
          apiKey: process.env.ANTHROPIC_API_KEY || '',
          model: 'claude-3-5-sonnet-20241022'
        } 
      })
    }
  ];

  // Learn weather capabilities
  for (const provider of providers) {
    await provider.ai.learn([weather.teach()]);
  }

  const prompt = 'Get current weather for London and explain the conditions';

  for (const provider of providers) {
    console.log(`\n📡 Testing ${provider.name}:`);
    console.log('=====================================');
    
    try {
      // Show tool schemas conversion
      const schemaNames = provider.ai.schemas();
      console.log(`🛠️  Converted ${schemaNames.length} tool schemas:`);
      schemaNames.forEach((schemaName, i) => {
        console.log(`   ${i + 1}. ${schemaName}`);
      });

      // Test tool calling
      console.log('\n🤖 Making AI call with tools...');
      const response = await provider.ai.call(prompt, { useTools: true });
      
      console.log(`📝 Response: ${response.content.slice(0, 200)}...`);
      console.log(`🔧 Tool calls made: ${response.toolCalls?.length || 0}`);
      console.log(`💰 Tokens used: ${response.usage?.total_tokens || 'unknown'}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n🎯 Format Differences Summary:');
  console.log('====================================');
  console.log('OpenAI Format:');
  console.log('  ✓ Tools nested under "function" property');
  console.log('  ✓ Schema uses "parameters" field');
  console.log('  ✓ Tool calls in standard format');
  console.log('');
  console.log('Claude Format:');
  console.log('  ✓ Tools are flat objects');
  console.log('  ✓ Schema uses "input_schema" field');
  console.log('  ✓ Tool calls as "tool_use" content blocks');
  console.log('');
  console.log('🔄 Adapter Pattern:');
  console.log('  ✓ Units export universal ToolSchema');
  console.log('  ✓ Each provider converts to native format');
  console.log('  ✓ Same Unit capabilities work everywhere');
}

// Show internal tool format conversion
function showToolFormatConversion() {
  console.log('\n🔧 Internal Tool Format Conversion:');
  console.log('====================================');
  
  // Example Unit ToolSchema
  const unitSchema = {
    name: 'weather.getCurrentWeather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object' as const,
      properties: {
        location: {
          type: 'string' as const,
          description: 'City name or coordinates'
        }
      },
      required: ['location']
    }
  };

  console.log('📋 Unit ToolSchema:');
  console.log(JSON.stringify(unitSchema, null, 2));

  // OpenAI conversion
  const openaiTool = {
    type: 'function' as const,
    function: {
      name: unitSchema.name.replace('.', '_'),
      description: unitSchema.description,
      parameters: unitSchema.parameters
    }
  };

  console.log('\n🤖 OpenAI ToolDefinition:');
  console.log(JSON.stringify(openaiTool, null, 2));

  // Claude conversion  
  const claudeTool = {
    name: unitSchema.name.replace('.', '_'),
    description: unitSchema.description,
    input_schema: {
      type: 'object',
      properties: unitSchema.parameters.properties,
      required: unitSchema.parameters.required
    }
  };

  console.log('\n🧠 Claude Tool:');
  console.log(JSON.stringify(claudeTool, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateFormatDifferences()
    .then(() => showToolFormatConversion())
    .catch(console.error);
}
