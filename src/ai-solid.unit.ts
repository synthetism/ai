import { Unit, createUnitSchema } from '@synet/unit';
import type { UnitProps, TeachingContract } from '@synet/unit';
import { OpenAI } from './providers/openai.js';
import type { 
  IAI, 
  AIResponse, 
  ChatMessage,
  AskOptions,
  ChatOptions,
  ToolsRequest,
  ToolDefinition,
  AIProviderType,
  OpenAIConfig
} from './types.js';

export interface AIProps extends UnitProps {
  provider: IAI;
  providerType: AIProviderType;
  config: Record<string, unknown>;
}

/**
 * AI Unit - Orchestrates AI providers with tool calling capabilities
 * 
 * Clean architecture following @synet/fs pattern:
 * - Unit orchestrates providers (doesn't learn them)
 * - Direct method calls to underlying provider
 * - Clean separation of concerns
 * 
 * @example
 * ```typescript
 * const ai = AI.openai({ apiKey: 'sk-...' });
 * 
 * const response = await ai.ask('What is 2+2?');
 * 
 * // Tool calling with prepared definitions
 * const tools = [{ type: 'function', function: { name: 'calc', ... } }];
 * await ai.tools(tools, { prompt: 'Calculate 25 * 4' });
 * ```
 */
export class AI extends Unit<AIProps> implements IAI {
  protected constructor(props: AIProps) {
    super(props);
  }

  // =============================================================================
  // FACTORY METHODS (following @synet/fs pattern)
  // =============================================================================

  /**
   * Create OpenAI provider instance
   */
  static openai(config: OpenAIConfig): AI {
    const provider = new OpenAI(config);
    
    const props: AIProps = {
      dna: createUnitSchema({
        id: 'ai',
        version: '1.0.0'
      }),
      provider,
      providerType: 'openai',
      config: { ...config } as Record<string, unknown>
    };

    return new AI(props);
  }

  // TODO: Add other providers
  // static deepseek(config: DeepseekConfig): AI { ... }
  // static anthropic(config: AnthropicConfig): AI { ... }

  // =============================================================================
  // IAI INTERFACE IMPLEMENTATION (direct provider calls)
  // =============================================================================

  async ask(prompt: string, options?: AskOptions): Promise<AIResponse> {
    return await this.props.provider.ask(prompt, options);
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    return await this.props.provider.chat(messages, options);
  }

  async tools(toolDefinitions: ToolDefinition[], request: ToolsRequest): Promise<AIResponse> {
    // Clean tool calling - provider works with ToolDefinition, not TeachingContract
    return await this.props.provider.tools(toolDefinitions, request);
  }

  async validateConnection(): Promise<boolean> {
    return await this.props.provider.validateConnection();
  }

  // =============================================================================
  // UNIT ARCHITECTURE METHODS
  // =============================================================================

  capabilities(): string[] {
    return [
      'ai.ask',
      'ai.chat', 
      'ai.tools',
      'ai.validateConnection',
      'ai.getProvider',
      'ai.getConfig'
    ];
  }

  teach(): TeachingContract {
    return {
      unitId: this.dna.id,
      capabilities: {
        ask: this.ask.bind(this) as (...args: unknown[]) => unknown,
        chat: this.chat.bind(this) as (...args: unknown[]) => unknown,
        tools: this.tools.bind(this) as (...args: unknown[]) => unknown,
        validateConnection: this.validateConnection.bind(this) as (...args: unknown[]) => unknown,
        getProvider: this.getProvider.bind(this) as (...args: unknown[]) => unknown,
        getConfig: this.getConfig.bind(this) as (...args: unknown[]) => unknown
      }
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  getProvider(): AIProviderType {
    return this.props.providerType;
  }

  getConfig(): Record<string, unknown> {
    return { ...this.props.config };
  }

  /**
   * Create tool definitions from unit teaching contracts
   * This is the bridge between Unit Architecture and AI providers
   */
  createToolDefinitions(teachingContracts: TeachingContract[]): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    
    for (const contract of teachingContracts) {
      for (const [capabilityName] of Object.entries(contract.capabilities)) {
        tools.push({
          type: 'function',
          function: {
            name: `${contract.unitId}.${capabilityName}`,
            description: `Execute ${capabilityName} capability from ${contract.unitId} unit`,
            parameters: {
              type: 'object',
              properties: {
                input: {
                  type: 'string',
                  description: 'Input for the capability'
                }
              },
              required: ['input']
            }
          }
        });
      }
    }

    return tools;
  }

  help(): string {
    return `
AI Unit v${this.dna.version} - ${this.props.providerType} provider

CAPABILITIES:
  • ask(prompt, options?) - Single AI query
  • chat(messages[], options?) - Multi-turn conversation
  • tools(toolDefinitions[], request) - Tool calling with prepared definitions
  • validateConnection() - Test provider connectivity

PROVIDER: ${this.props.providerType}

TOOL CALLING:
  Use createToolDefinitions() to convert TeachingContract[] to ToolDefinition[]
  Then pass to tools() method for AI orchestration.

EXAMPLES:
  ai.ask('What is 2+2?');
  ai.chat([{ role: 'user', content: 'Hello!' }]);
  
  // Tool calling
  const tools = ai.createToolDefinitions([calculator.teach()]);
  ai.tools(tools, { prompt: 'Calculate 25 * 4' });
    `;
  }

  whoami(): string {
    return `AI Unit (${this.props.providerType}) with ${this.capabilities().length} capabilities`;
  }
}
