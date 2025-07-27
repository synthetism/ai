import { Unit, createUnitSchema } from '@synet/unit';
import type { UnitProps, TeachingContract, ToolSchema } from '@synet/unit';
import { OpenAI } from './providers/openai.js';
import { Claude } from './providers/claude.js';
import type { 
  IAI, 
  AIResponse, 
  ChatMessage,
  AskOptions,
  ChatOptions,
  ToolsRequest,
  ToolDefinition,
  ToolCall,
  CallOptions,
  AIProviderType,
  OpenAIConfig
} from './types.js';

export interface AIProps extends UnitProps {
  provider: IAI;
  providerType: AIProviderType;
  config: Record<string, unknown>;
}

export interface AIConfig<T extends AIProviderType = AIProviderType> {
  type: T;
  options: T extends 'openai' ? OpenAIConfig : Record<string, unknown>;
}

interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
  error?: string;
}

/**
 * AI Unit - Clean v1.0.6 Implementation
 * 
 * Following async-filesystem-unit pattern:
 * - create() factory method with backend selection
 * - Enhanced interface: ask/chat with optional tools, call() with learned schemas
 * - Unit Architecture: teach/learn paradigm for capability sharing
 * 
 * @example
 * ```typescript
 * // Create AI unit with OpenAI backend
 * const ai = AI.create({ type: 'openai', options: { apiKey: 'sk-...' } });
 * 
 * // Simple usage
 * const response = await ai.ask('What is 2+2?');
 * 
 * // With learned capabilities (Unit Architecture magic)
 * await ai.learn([weather.teach(), calculator.teach()]);
 * const response = await ai.call('Get weather for 3 cities and calculate average', {
 *   useTools: true
 * });
 * ```
 */
export class AIOperator extends Unit<AIProps> implements IAI {
  
  protected constructor(props: AIProps) {
    super(props);
  }

  // =============================================================================
  // FACTORY METHOD (following @synet/fs pattern)
  // =============================================================================

  /**
   * Create AI unit with specified backend
   */
  static create<T extends AIProviderType>(config: AIConfig<T>): AIOperator {
    const backend = AIOperator.createBackend(config);

    const props: AIProps = {
      dna: createUnitSchema({
        id: 'ai',
        version: '1.0.6'
      }),
      provider: backend,
      providerType: config.type,
      config: { ...config.options } as Record<string, unknown>
    };

    return new AIOperator(props);
  }

  // =============================================================================
  // ENHANCED IAI INTERFACE (v1.0.6 Clean Architecture)
  // =============================================================================

  /**
   * Simple AI query with optional tools
   */
  async ask(prompt: string, options?: AskOptions & { tools?: ToolDefinition[] }): Promise<AIResponse> {
    const allTools = options?.tools || [];
    
    if (allTools.length > 0) {
      // TypeScript needs explicit typing for systemPrompt
      const extendedOptions = options as AskOptions & { tools?: ToolDefinition[]; systemPrompt?: string };
      return this.props.provider.tools(allTools, {
        prompt,
        systemPrompt: extendedOptions?.systemPrompt,
        metadata: options?.metadata
      });
    }
    
    return this.props.provider.ask(prompt, options);
  }

  /**
   * Conversational AI with optional tools
   */
  async chat(messages: ChatMessage[], options?: ChatOptions & { tools?: ToolDefinition[] }): Promise<AIResponse> {
    if (options?.tools?.length) {
      // Convert to tools call
      const lastMessage = messages[messages.length - 1];
      return this.props.provider.tools(options.tools, {
        prompt: lastMessage.content,
        systemPrompt: options.systemPrompt,
        metadata: options.metadata
      });
    }
    
    return this.props.provider.chat(messages, options);
  }

  /**
   * Revolutionary: AI with learned capabilities (Unit Architecture bridge)
   */
  async call(prompt: string, options?: CallOptions): Promise<AIResponse> {
    let tools: ToolDefinition[] = options?.tools || [];
    
    if (options?.useTools) {
      // Convert all learned schemas to tool definitions
      tools = [...tools, ...this.convertSchemasToTools()];
    } else if (options?.schemas) {
      // Convert specific schemas to tool definitions
      tools = [...tools, ...this.convertSpecificSchemas(options.schemas)];
    }
    
    // Step 1: Make initial AI call with tools
    const initialResponse = await this.ask(prompt, { ...options, tools });
    
    // Step 2: If AI made tool calls, execute them and continue conversation
    if (initialResponse.toolCalls && initialResponse.toolCalls.length > 0) {
      const toolResults = await this.executeToolCalls(initialResponse.toolCalls);
      
      // Step 3: Continue conversation with tool results
      const messages: ChatMessage[] = [
        { role: 'user', content: prompt },
        { 
          role: 'assistant', 
          content: initialResponse.content,
          metadata: { toolCalls: initialResponse.toolCalls }
        },
        {
          role: 'user',
          content: `Tool results:\n${toolResults.map((r: ToolExecutionResult) => `${r.toolName}: ${JSON.stringify(r.result)}`).join('\n')}`
        }
      ];
      
      // Get final response with tool results
      return await this.chat(messages, options);
    }
    
    return initialResponse;
  }

  /**
   * Direct provider tool calling (legacy compatibility)
   */
  async tools(toolDefinitions: ToolDefinition[], request: ToolsRequest): Promise<AIResponse> {
    return await this.props.provider.tools(toolDefinitions, request);
  }

  async validateConnection(): Promise<boolean> {
    return await this.props.provider.validateConnection();
  }

  // =============================================================================
  // UNIT ARCHITECTURE METHODS
  // =============================================================================

  whoami(): string {
    return `AI Unit (${this.props.providerType})`;
  }

  capabilities(): string[] {
    return [
      'ai.ask',
      'ai.chat', 
      'ai.call',
      'ai.tools',
      'ai.validateConnection'
    ];
  }

  teach(): TeachingContract {
    return {
      unitId: this.props.dna.id,
      capabilities: {
        ask: (...args: unknown[]) => this.ask(args[0] as string, args[1] as AskOptions),
        chat: (...args: unknown[]) => this.chat(args[0] as ChatMessage[], args[1] as ChatOptions),
        call: (...args: unknown[]) => this.call(args[0] as string, args[1] as CallOptions),
        tools: (...args: unknown[]) => this.tools(args[0] as ToolDefinition[], args[1] as ToolsRequest),
        validateConnection: () => this.validateConnection()
      }
    };
  }

  help(): void {
    console.log(`
AI Unit - Intelligent Operations with Unit Architecture

CORE CAPABILITIES:
• ask(prompt) - Simple AI query
• chat(messages) - Conversational AI  
• call(prompt, options) - AI with learned tools 🔥
• tools(definitions, request) - Direct tool calling
• validateConnection() - Test provider connection

UNIT ARCHITECTURE:
• learn([unit.teach()]) - Acquire capabilities from other units
• call(prompt, { useTools: true }) - Use learned capabilities automatically

PROVIDER: ${this.props.providerType}
LEARNED SCHEMAS: ${this.schemas().length}

EXAMPLE USAGE:
  const ai = AI.create({ type: 'openai', options: { apiKey: 'sk-...' } });
  
  // Learn from weather unit
  await ai.learn([weather.teach()]);
  
  // Use learned capabilities
  const report = await ai.call('Create weather report for London, Paris, Tokyo', {
    useTools: true
  });
`);
  }

  // =============================================================================
  // TOOL EXECUTION (Unit Architecture v1.0.6)
  // =============================================================================

  /**
   * Execute tool calls using learned capabilities
   */
  private async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        // Check for special registry search commands
        if (toolCall.function.name === 'registry_search') {
          const searchResult = await this.handleRegistrySearch(toolCall);
          results.push(searchResult);
          continue;
        }
        
        // Convert OpenAI tool name back to capability name (reverse the underscore replacement)
        const capabilityName = toolCall.function.name.replace('_', '.');
        
        if (!this.can(capabilityName)) {
          results.push({
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            result: null,
            error: `Capability '${capabilityName}' not found. Try using registry_search to find new tools.`
          });
          continue;
        }
        
        // Execute the capability with the provided arguments
        const args = Object.values(toolCall.function.arguments);
        const result = await this.execute(capabilityName, ...args);
        
        results.push({
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          result,
          error: undefined
        });
        
      } catch (error) {
        results.push({
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  /**
   * Handle registry search and dynamic tool acquisition
   */
  private async handleRegistrySearch(toolCall: ToolCall): Promise<ToolExecutionResult> {
    // This is where the magic happens - AI can discover new tools at runtime!
    if (this.can('registry.search')) {
      try {
        const searchQuery = toolCall.function.arguments.query as string;
        const foundUnits = await this.execute('registry.search', searchQuery);
        
        return {
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          result: `Found units: ${JSON.stringify(foundUnits)}. Use 'registry.get' to acquire their capabilities.`,
          error: undefined
        };
      } catch (error) {
        return {
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          result: null,
          error: `Registry search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
    
    return {
      toolCallId: toolCall.id,
      toolName: toolCall.function.name,
      result: null,
      error: 'Registry not available. Learn from UnitRegistry to enable dynamic tool discovery.'
    };
  }

  // =============================================================================
  // TOOL SCHEMA CONVERSION (Unit Architecture v1.0.6)
  // =============================================================================

  /**
   * Convert all learned schemas to tool definitions
   */
  private convertSchemasToTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    
    for (const [key, schema] of this._tools) {
      tools.push({
        type: 'function',
        function: {
          name: key.replace('.', '_'), // OpenAI-safe naming
          description: schema.description,
          parameters: schema.parameters
        }
      });
    }
    
    return tools;
  }

  /**
   * Convert specific schemas to tool definitions
   */
  private convertSpecificSchemas(schemaNames: string[]): ToolDefinition[] {
    return schemaNames
      .map(name => this.getSchema(name))
      .filter((schema): schema is NonNullable<typeof schema> => Boolean(schema))
      .map(schema => ({
        type: 'function' as const,
        function: {
          name: schema.name.replace('.', '_'),
          description: schema.description,
          parameters: schema.parameters
        }
      }));
  }

  // =============================================================================
  // PROVIDER FACTORY (following @synet/fs pattern)
  // =============================================================================

  /**
   * Create specific AI backend
   */
  private static createBackend<T extends AIProviderType>(config: AIConfig<T>): IAI {
    const { type, options } = config;

    switch (type) {
      case 'openai': {
        const openaiOptions = options as OpenAIConfig;
        if (!openaiOptions.apiKey) {
          throw new Error('OpenAI provider requires apiKey');
        }
        return new OpenAI(openaiOptions);
      }

      // TODO: Add other providers following same pattern
      // case 'anthropic': {
      //   const anthropicOptions = options as AnthropicConfig;
      //   return new Anthropic(anthropicOptions);
      // }

      default:
        throw new Error(`Unsupported AI provider: ${type}`);
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get provider type
   */
  getProvider(): AIProviderType {
    return this.props.providerType;
  }

  /**
   * Get provider configuration
   */
  getConfig(): Record<string, unknown> {
    return { ...this.props.config };
  }

  /**
   * Create new AI unit with different provider (Unit Architecture pattern)
   */
  withProvider<T extends AIProviderType>(config: AIConfig<T>): AIOperator {
    return AIOperator.create(config);
  }
}
