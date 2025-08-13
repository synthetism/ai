/**
 * Debug GPT-5 request to see what's being sent
 */
const { readFileSync } = require('fs');

async function debugGPT5() {
  console.log('🔍 Debugging GPT-5 request...');
  
  const config = JSON.parse(readFileSync('private/openai.json', 'utf-8'));
  
  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello!' }],
    temperature: 1,
    max_completion_tokens: 1000,
  };
  
  console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Success! Response:', data.choices[0].message.content);
    } else {
      console.log('❌ Error status:', response.status);
      console.log('📥 Error response:', responseText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

debugGPT5().catch(console.error);
