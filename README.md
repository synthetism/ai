# AI Operator Unit

```bash
     \    _ _|       |   |        _)  |   
    _ \     |        |   |  __ \   |  __| 
   ___ \    |        |   |  |   |  |  |   
 _/    _\ ___|      \___/  _|  _| _| \__| 
                                                
version: 1.0.5                                 
```

**Universal AI provider interface with built-in function calling support, following (⊚) Unit Architecture**

## In Package

- **Zero Dependencies** - No external packages, pure TypeScript
- **Universal Interface** - One `IAI` interface for custom providers
- **Production Ready** - Error handling, retries, connection validation
- **Secure & Auditable** - Minimal attack surface, transparent code
- **Function Calling First** - Built-in tool support across all providers

## Supported Providers

| Provider | Status | Models | Function Calling | Cost |
|----------|--------|--------|------------------|------|
| **OpenAI** | ✅ Production | gpt-5, gpt-5-mini | Parallel | $$$ |
| **OpenRouter** | ✅ Production | 200+ models | Parallel | $ |
| **DeepSeek** | ✅ Production | deepseek-chat | Parallel | $ |
| **Gemini** | ✅ Production | gemini-1.5-flash | Parallel | $$ |
| **Grok** | ✅ Production | grok-3-mini | Parallel | $ |
| **Mistral** | ✅ Production | mistral-medium-latest | Parallel | $$ |
| **Claude** | ✅ Production | claude-4-sonnet | Sequential* | $$$ |

*\*Claude has sequential function calling that's build for agentic flows, use it with @synet/agent Switch agent*

## Quick Start

```typescript
import { AI } from '@synet/ai';

// Choose your provider
const ai = AI.openai({ apiKey: 'sk-...', model:'gpt-4o-mini' });
const ai = AI.openrouter({ apiKey: 'sk-or-...', model: 'openai/gpt-oss-20b' });
const ai = AI.deepseek({ apiKey: 'sk-...',model: 'deepseek-chat' });
const ai = AI.gemini({ apiKey: 'AIza...',model:'gemini-1.5-flash' });
const ai = AI.grok({ apiKey: 'xai-...',model:'grok-3-mini' });
const ai = AI.mistral({ apiKey: 'sk-...', model:'mistral-medium-latest' });
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
| 1 | **DeepSeek** | Slow | Excellent | Cheapest | **Best Overall Value** |
| 2 | **OpenRouter** | Good | Good | Very Cheap | **Budget + Free Model Variety** |
| 3 | **OpenAI** | Fast | Good | Expensive | **Speed Critical Apps** |
| 4 | **Mistral** | Good | Excellent | Moderate | **European Privacy** |
| 5 | **Gemini** | Good | Excellent | Moderate | **Google Ecosystem** |
| 6 | **Grok** | Slow | Excellent | Very Cheap | **Budget + Quality** |
| 7 | **Claude** | Slow | Incomplete* | Expensive | **Text-only Tasks** |

*\*Claude's enables only sequential tools calling, best used in with @synet/agent *


# API Reference

## AIOperator Unit

The core AI unit that implements Unit Architecture with universal provider interface.

### Constructor

```typescript
import { AIOperator } from '@synet/ai';

// Create AI unit with specific provider
const ai = AIOperator.create({
  type: 'openai',
  options: { 
    apiKey: 'sk-...', 
    model: 'gpt-4o-mini' 
  }
});
```

### Core Methods

#### `ask(prompt, options?)` 

Simple AI query with optional tools.

```typescript
async ask(
  prompt: string, 
  options?: AskOptions & { tools?: ToolDefinition[] }
): Promise<AIResponse>
```

**Example:**
```typescript
const response = await ai.ask('What is the capital of France?');
console.log(response.content); // "The capital of France is Paris."

// With tools
const response = await ai.ask('Get weather for London', {
  tools: [weatherToolDefinition]
});
```

#### `chat(messages, options?)`

Conversational AI with message history.

```typescript
async chat(
  messages: ChatMessage[], 
  options?: ChatOptions & { tools?: ToolDefinition[] }
): Promise<AIResponse>
```

**Example:**
```typescript
const messages = [
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' }
];
const response = await ai.chat(messages);
```

#### `call(prompt, options?)` 🔥

**Most powerful method** - AI with automatic learned tool execution.

```typescript
async call(
  prompt: string, 
  options?: CallOptions
): Promise<AIResponse>
```

**Example:**
```typescript
// Learn capabilities from weather unit
ai.learn([weather.teach()]);

// AI automatically uses weather tools when needed
const response = await ai.call('Create weather report for London, Paris, Tokyo', {
  useTools: true
});
```

#### `chatWithTools(messages, options?)` 🔥

Chat with automatic tool execution using learned capabilities.

```typescript
async chatWithTools(
  messages: ChatMessage[], 
  options?: CallOptions
): Promise<AIResponse>
```

**Example:**
```typescript
const messages = [
  { role: 'user', content: 'I need weather data for my trip planning' }
];
const response = await ai.chatWithTools(messages);
// AI automatically executes weather tools and provides comprehensive response
```

#### `tools(toolDefinitions, request)`

Direct function calling with specific tool definitions.

```typescript
async tools(
  toolDefinitions: ToolDefinition[], 
  request: ToolsRequest
): Promise<AIResponse>
```

#### `validateConnection()`

Test provider connection and authentication.

```typescript
async validateConnection(): Promise<boolean>
```

### Unit Architecture Methods

#### `learn(contracts)`

Learn capabilities from other units.

```typescript
learn(contracts: TeachingContract[]): void
```

**Example:**
```typescript
import { WeatherUnit } from '@synet/weather';
import { EmailUnit } from '@synet/email';

const weather = WeatherUnit.create({ apiKey: 'weather-key' });
const email = EmailUnit.create({ smtp: { /* config */ } });

// AI learns weather and email capabilities
ai.learn([weather.teach(), email.teach()]);

// Now AI can use weather.getCurrentWeather and email.send automatically
```

#### `teach()`

Share AI capabilities with other units.

```typescript
teach(): TeachingContract
```

#### `can(capability)`

Check if AI has specific capability.

```typescript
can(capability: string): boolean
```

**Example:**
```typescript
if (ai.can('weather.getCurrentWeather')) {
  console.log('AI can get weather data');
}
```
### Utility Methods

#### `getProvider()`

Get current provider type.

```typescript
getProvider(): AIProviderType
```

#### `getConfig()`

Get provider configuration.

```typescript
getConfig(): Record<string, unknown>
```

#### `withProvider(config)`

Create new AI unit with a custom IAI provider.

```typescript
withProvider<T extends AIProviderType>(config: AIConfig<T>): AIOperator
```

**Example:**
```typescript
const openaiAI = ai.withProvider({
  type: 'openai',
  options: { apiKey: 'sk-...', model: 'gpt-4o' }
});
```

### Types

#### `AIResponse`

```typescript
interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  toolCalls?: ToolCall[];
  metadata?: Record<string, unknown>;
}
```

#### `ChatMessage`

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
}
```

### Configuration Types

#### `AIConfig`

```typescript
interface AIConfig<T extends AIProviderType = AIProviderType> {
  type: T;
  options: T extends "openai" ? OpenAIConfig : 
          T extends "claude" ? OpenAIConfig :
          T extends "deepseek" ? OpenAIConfig :
          // ... other provider configs
}
```

#### `OpenAIConfig` (used by multiple providers)

```typescript
interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
}
```

### Options Types

#### `CallOptions`

```typescript
interface CallOptions {
  useTools?: boolean;
  maxToolCalls?: number;
  tools?: ToolDefinition[];
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}
```

#### `AskOptions`

```typescript
interface AskOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
}
```


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
- OpenAI, DeepSeek, Gemini, Grok, Mistral, Open Router execute multiple function calls simultaneously
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
- **Mistral**: [console.mistral.ai](https://console.mistral.ai)
- **Open Router**: [openrouter.ai](https://openrouter.ai)
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
**3. Run demos**

```bash
tsx demo:weather // Test this first
tsx demo:openai
tsx demo:deepseek
tsx demo:gemini
tsx demo:grok
tsx demo:mistral
tsx demo:openrouter
```

**4. Create tools with (⊚) Unit Architecture**

```bash
npm i @synet/unit
```

Documentation:
[https://github.com/synthetism/unit](https://github.com/synthetism/unit)

## Tools

**Available tools that can teach capabilities to AI  Operator:**

### Utilities
- **@synet/email** - Send emails via SMTP, AWS SES, Resend
- **@synet/weather** - Weather data and forecasts from multiple providers

### Storage
- **@synet/fs** - Single API for any filesystem, node, memory + cloud providers
- **@synet/vault** - Secure, type-safe storage of secrets in any IFileSystem compatible  filesystem.

### Network Tools  
- **@synet/http** - HTTP requests and API integration
- **@synet/network** - Resilient http requests with retry, rate-limiter and proxy

### Decentralized Identity Tools
- **@synet/identity** - Create decentralized identity 
- **@synet/keys** - Cryptographic key generation and signer
- **@synet/credential** - Verifiable Credential creation and signing
- **@synet/vp** - Verifiable Presentation issuance and verification
- **@synet/did** -  Decentralised ID from keys

### System Tools
- **@synet/queue** - Job queue and task management  
- **@synet/cache** - Multi-backend caching system
- **@synet/kv** - Multi-backend Key Value storage system
- **@synet/realtime** - Multi-backend Realtime Channels and Events

## Scrapers 

- **@synet/scraper** - Scrape any page (request dev access)
- **@synet/formatter** - Multi-format  (request dev access)

### Security Tools
- **@synet/hasher** - Cryptographic hashing operations
- **@synet/crypto** - Encryption and security operations

### Data Tools
- **@synet/encoder** - Data encoding and transformation
- **@synet/validator** - Data validation and schema checking
- **@synet/logger** - Structured, multi-provider logging and monitoring, remote events emitter. 

**Usage Example:**
```typescript
import { AI } from '@synet/ai';
import { EmailUnit } from '@synet/email';
import { WeatherUnit } from '@synet/weather';

const ai = AI.openai({ apiKey: 'sk-...' });
const email = EmailUnit.create({ /* config */ });
const weather = WeatherUnit.create({ /* config */ });

// AI learns capabilities from tools
ai.learn([email.teach(), weather.teach()]);

// AI can now send emails and get weather data
const result = await ai.call("Send weather report for London to user@example.com", {
  useTools: true
});
```

**Create Your Own Tools:**

Follow Unit Architecture to create custom AI tools:
```bash
npm install @synet/unit
```

See [TOOLS.md](/.unit/TOOLS.md) for complete tool catalog.

## License

MIT

