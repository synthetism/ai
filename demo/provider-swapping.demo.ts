/**
 * AI Provider Factory Demo
 * 
 * Shows the scary simplicity of switching AI providers
 * Same Unit capabilities, different AI backends
 */

import { AIOperator as AI } from '../src/ai.unit.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';

// The scary part: THIS IS ALL IT TAKES
const aiProviders = {
  openai: () => AI.create({ 
    type: 'openai' as const, 
    options: { apiKey: process.env.OPENAI_API_KEY || '' }
  }),
  
  claude: () => AI.create({ 
    type: 'claude' as const, 
    options: { apiKey: process.env.ANTHROPIC_API_KEY || '' }
  })
};

async function demonstrateProviderSwapping() {
  console.log('🚀 AI Provider Swapping Demo');
  console.log('===============================\n');

  // Create weather capability
  const weather = WeatherUnit.create({
    apiKey: process.env.OPENWEATHER_API_KEY || 'demo-key'
  });

  const prompt = 'Get weather for New York, London, and Tokyo. Create a brief comparison.';

  // Test each provider with SAME capabilities
  for (const [providerName, createAI] of Object.entries(aiProviders)) {
    console.log(`\n🤖 Testing ${providerName.toUpperCase()}:`);
    console.log('─'.repeat(40));
    
    try {
      // Create AI unit
      const ai = createAI();
      
      // Learn weather capabilities (same for all)
      await ai.learn([weather.teach()]);
      
      console.log(`✅ Provider: ${ai.getProvider()}`);
      console.log(`🧠 Model: ${ai.getConfig().model || 'default'}`);
      console.log(`📚 Learned schemas: ${ai.schema().size()}`);
      
      // Execute same prompt
      const startTime = Date.now();
      const response = await ai.call(prompt, { useTools: true });
      const duration = Date.now() - startTime;
      
      console.log(`⚡ Response time: ${duration}ms`);
      console.log(`🔧 Tool calls: ${response.toolCalls?.length || 0}`);
      console.log(`💭 Response preview: ${response.content.slice(0, 150)}...`);
      
    } catch (error) {
      console.log(`❌ ${providerName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n💡 The Scary Reality:');
  console.log('=====================');
  console.log('✓ Same Unit capabilities work across ALL providers');
  console.log('✓ Provider switching is just a config change');
  console.log('✓ No code changes needed in application logic');
  console.log('✓ Units abstract away provider differences');
  console.log('');
  console.log('🏗️  Building AWS on AI:');
  console.log('✓ 1 Unit = 1 API well done');
  console.log('✓ 3 Units = 1 service group');
  console.log('✓ 3 Groups = substantial infrastructure');
  console.log('✓ Time to build: 7 days, not 24 months');
}

async function showRuntimeProviderSwitch() {
  console.log('\n🔄 Runtime Provider Switching:');
  console.log('================================');
  
  // Start with OpenAI
  let ai = aiProviders.openai();
  console.log(`Starting with: ${ai.getProvider()}`);
  
  // Switch to Claude at runtime
  ai = ai.withProvider({ 
    type: 'claude', 
    options: { apiKey: process.env.ANTHROPIC_API_KEY || '' }
  });
  console.log(`Switched to: ${ai.getProvider()}`);
  
  console.log('✨ Same AI variable, different backend!');
  console.log('✨ No capability loss, just provider change');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateProviderSwapping()
    .then(() => showRuntimeProviderSwitch())
    .catch(console.error);
}
