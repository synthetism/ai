# @synet/ai

```bash
     \    _ _|       |   |        _)  |   
    _ \     |        |   |  __ \   |  __| 
   ___ \    |        |   |  |   |  |  |   
 _/    _\ ___|      \___/  _|  _| _| \__| 
                                                
version: 1.0.0                                  
```

**Universal AI provider interface with built-in function calling support**

## Why

- **Zero Dependencies** - No external packages, pure TypeScript
- **Universal Interface** - One `IAI` interface for all providers
- **Production Ready** - Error handling, retries, connection validation
- **Secure & Auditable** - Minimal attack surface, transparent code
- **Function Calling First** - Built-in tool support across all providers

## Supported Providers

| Provider | Status | Models | Function Calling | Cost |
|----------|--------|--------|------------------|------|
| **OpenAI** | ✅ Production | gpt-4o, gpt-4o-mini | Parallel | $$$ |
| **DeepSeek** | ✅ Production | deepseek-chat | Parallel | $ |
| **Gemini** | ✅ Production | gemini-1.5-flash | Parallel | $$ |
| **Grok** | ✅ Production | grok-3-mini | Parallel | $ |
| **Claude** | ⚠️ Limited | claude-3-5-sonnet | Sequential* | $$$ |

*\*Claude has sequential function calling that often requires user intervention*

## Quick Start

```typescript
import { AI } from '@synet/ai';

// Choose your provider
const ai = AI.openai({ apiKey: 'sk-...', model:'gpt-4o-mini' });
const ai = AI.deepseek({ apiKey: 'sk-...',model: 'deepseek-chat' });
const ai = AI.gemini({ apiKey: 'AIza...',model:'gemini-1.5-flash' });
const ai = AI.grok({ apiKey: 'xai-...',model:'grok-3-mini' });
const ai = AI.claude({ apiKey: 'sk-ant...', model:'claude-3-7-sonnet-20250219' }); // Limited function calling

// Universal interface works identically
const response = await ai.ask('What is 2+2?');
console.log(response.content); // "2+2 equals 4"
```

## IAI Interface

All providers implement the same universal interface:

```typescript
interface IAI {
  ask(prompt: string, options?: AskOptions): Promise<AIResponse>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse>;
  tools(toolDefinitions: ToolDefinition[], request: ToolsRequest): Promise<AIResponse>;
  validateConnection(): Promise<boolean>;
}
```

### Core Methods

```typescript
// Simple text generation
const response = await ai.ask('Explain quantum computing');

// Conversational chat
const messages = [
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' }
];
const response = await ai.chat(messages);

// Direct function calling
const tools = [/* tool definitions */];
const response = await ai.tools(tools, { prompt: 'Get weather for London' });

// Connection validation
const isConnected = await ai.validateConnection();
```

## Provider Performance Ranking

Based on comprehensive function calling tests:

| Rank | Provider | Speed | Quality | Cost | Best For |
|------|----------|-------|---------|------|----------|
| 🥇 | **DeepSeek** | Good | Excellent | Cheapest | **Best Overall Value** |
| 🥈 | **OpenAI** | Fast | Good | Expensive | **Speed Critical Apps** |
| 🥉 | **Gemini** | Good | Excellent | Moderate | **Google Ecosystem** |
| 4️⃣ | **Grok** | Slow | Excellent | Very Cheap | **Budget + Quality** |
| 5️⃣ | **Claude** | Slow | Incomplete* | Expensive | **Text-only Tasks** |

*\*Claude's sequential function calling often produces incomplete results*

## Unit Architecture Integration

@synet/ai integrates seamlessly with Unit Architecture for advanced capability composition:

```typescript
import { AI } from '@synet/ai';
import { WeatherUnit } from '@synet/weather';

// Create AI and weather units
const ai = AI.deepseek({ apiKey: 'sk-...' });
const weather = WeatherUnit.create({ defaultUnits: 'metric' });

// AI learns weather capabilities
ai.learn([weather.teach()]);

// AI can now use weather tools automatically
const response = await ai.call('Get weather for London, Paris, Tokyo and compare', {
  useTools: true
});

console.log(response.content);
// Generates comprehensive weather report using learned capabilities
```

### Function Calling Behavior

**Parallel Providers (Recommended):**
- OpenAI, DeepSeek, Gemini, Grok execute multiple function calls simultaneously
- Complete reports in single request
- Efficient and predictable

**Sequential Provider (Not Recommended for Function Calling):**
- Claude executes one function call at a time
- Often stops mid-task asking for user confirmation
- Slower and incomplete results
- Better suited for text-only applications

## Installation

```bash
npm install @synet/ai
# or
pnpm add @synet/ai
```

## API Keys

Create your API keys:
- **OpenAI**: [platform.openai.com](https://platform.openai.com)
- **DeepSeek**: [platform.deepseek.com](https://platform.deepseek.com)
- **Gemini**: [aistudio.google.com](https://aistudio.google.com)
- **Grok**: [platform.x.ai](https://platform.x.ai)
- **Claude**: [console.anthropic.com](https://console.anthropic.com)

## Examples

See the `/demo` folder for comprehensive examples including:
- Basic provider usage
- Function calling with weather tools
- Performance comparisons
- Error handling patterns

## Running demos with tools calling

**1.Create credentials for each provider in /private folder**

private/openai.json
```json
{
    "name": "synet",
    "apiKey": "open-ai-api"
}
```

**2. Open Weather API**

Create private/openweather.json
```json
{

    "apiKey": "82d319ab...."
}
```
3. Run demos

```bash
tsx demo:weather  // Make sure weather API is setup
tsx demo:openai
tsx demo:deepseek
tsx demo:gemini
tsx demo:grok
```

4. Create tools with Unit Architecture

```bash
npm i @synet/unit
```

Documentation:
[https://github.com/synthetism/unit](https://github.com/synthetism/unit)



## License

MIT

