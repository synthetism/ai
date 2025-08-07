import { Unit, createUnitSchema } from '@synet/unit';
import type { UnitProps, TeachingContract, ToolSchema, UnitCore, Capabilities, Schema, Validator } from '@synet/unit';
import { Capabilities as CapabilitiesClass, Schema as SchemaClass, Validator as ValidatorClass } from '@synet/unit';
import { OpenAI } from './providers/openai.js';
import { Claude } from './providers/claude.js';
import { DeepSeek } from './providers/deepseek.js';
import { Grok } from './providers/grok.js';
import { Gemini } from './providers/gemini.js';
import { Mistral } from './providers/mistral.js';
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
  OpenAIConfig,
  BedrockConfig,
  MistralConfig
} from './types.js';

export interface AIProps extends UnitProps {
  provider: IAI;
  providerType: AIProviderType;
  config: Record<string, unknown>;
}

export interface AIConfig<T extends AIProviderType = AIProviderType> {
  type: T;
  options: T extends 'openai' ? OpenAIConfig : 
           T extends 'bedrock' ? BedrockConfig : 
           Record<string, unknown>;
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
  // CONSCIOUSNESS TRINITY - v1.0.7
  // =============================================================================

  /**
   * Build consciousness trinity - creates living instances once
   */
  protected build(): UnitCore {
    const capabilities = CapabilitiesClass.create(this.dna.id, {
      ask: (...args: unknown[]) => this.ask(args[0] as string, args[1] as AskOptions),
      chat: (...args: unknown[]) => this.chat(args[0] as ChatMessage[], args[1] as ChatOptions),
      call: (...args: unknown[]) => this.call(args[0] as string, args[1] as CallOptions),
      tools: (...args: unknown[]) => this.tools(args[0] as ToolDefinition[], args[1] as ToolsRequest),
      validateConnection: (...args: unknown[]) => this.validateConnection()
    });

    const schema = SchemaClass.create(this.dna.id, {
      ask: {
        name: 'ask',
        description: 'Simple AI query with optional tools',
        parameters: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'The question or prompt for the AI' },
            options: { type: 'object', description: 'Optional configuration for the request' }
          },
          required: ['prompt']
        },
        response: { type: 'object', properties: { content: { type: 'string', description: 'AI response content' } } }
      },
      chat: {
        name: 'chat',
        description: 'Conversational AI with message history',
        parameters: {
          type: 'object',
          properties: {
            messages: { type: 'array', description: 'Array of chat messages' },
            options: { type: 'object', description: 'Optional chat configuration' }
          },
          required: ['messages']
        },
        response: { type: 'object', properties: { content: { type: 'string', description: 'AI response content' } } }
      },
      call: {
        name: 'call',
        description: 'AI with learned capabilities and tool execution',
        parameters: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'The prompt for AI with tool access' },
            options: { type: 'object', description: 'Call options including useTools flag' }
          },
          required: ['prompt']
        },
        response: { type: 'object', properties: { content: { type: 'string', description: 'AI response with tool results' } } }
      },
      tools: {
        name: 'tools',
        description: 'Direct tool calling with AI provider',
        parameters: {
          type: 'object',
          properties: {
            toolDefinitions: { type: 'array', description: 'Array of tool definitions' },
            request: { type: 'object', description: 'Tool request configuration' }
          },
          required: ['toolDefinitions', 'request']
        },
        response: { type: 'object', properties: { content: { type: 'string', description: 'AI response' } } }
      },
      validateConnection: {
        name: 'validateConnection',
        description: 'Test connection to AI provider',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        response: { type: 'boolean' }
      }
    });

    const validator = ValidatorClass.create({
      unitId: this.dna.id,
      capabilities,
      schema,
      strictMode: false
    });

    return { capabilities, schema, validator };
  }

  /**
   * Get capabilities consciousness - returns living instance
   */
  capabilities(): Capabilities {
    return this._unit.capabilities;
  }

  /**
   * Get schema consciousness - returns living instance  
   */
  schema(): Schema {
    return this._unit.schema;
  }

  /**
   * Get validator consciousness - returns living instance
   */
  validator(): Validator {
    return this._unit.validator;
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
        { role: 'user', content: prompt }
      ];
      
      // Only add assistant message if it has content (avoid empty messages for Mistral)
      if (initialResponse.content?.trim()) {
        messages.push({ 
          role: 'assistant', 
          content: initialResponse.content,
          metadata: { toolCalls: initialResponse.toolCalls }
        });
      }
      
      messages.push({
        role: 'user',
        content: `Tool results:\n${toolResults.map((r: ToolExecutionResult) => `${r.toolName}: ${JSON.stringify(r.result)}`).join('\n')}`
      });
      
      // Get final response with tool results  
      const finalResponse = await this.chat(messages, options);
      
      // PRESERVE the original tool calls in the final response
      finalResponse.toolCalls = initialResponse.toolCalls;
      
      return finalResponse;
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

  teach(): TeachingContract {
    return {
      unitId: this.props.dna.id,
      capabilities: this._unit.capabilities,
      schema: this._unit.schema,
      validator: this._unit.validator
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
LEARNED SCHEMAS: ${this.schema().size()}

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
        // Convert OpenAI tool name back to capability name (reverse the underscore replacement)
        const capabilityName = toolCall.function.name.replace('_', '.');
        
        if (!this.can(capabilityName)) {
          results.push({
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            result: null,
            error: `Capability '${capabilityName}' not found`
          });
          continue;
        }
        
        // Execute the capability with the provided arguments
        const args = Object.values(toolCall.function.arguments);
        
        try {
          const result = await this.execute(capabilityName, ...args);
          
          results.push({
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            result,
            error: undefined
          });
        } catch (execError) {
          results.push({
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            result: null,
            error: execError instanceof Error ? execError.message : 'Unknown execution error'
          });
        }
        
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

  // =============================================================================
  // TOOL SCHEMA CONVERSION (Unit Architecture v1.0.6)
  // =============================================================================

  /**
   * Convert all learned schemas to tool definitions
   */
  private convertSchemasToTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    
    for (const schema of this.schema().toArray()) {
      tools.push({
        type: 'function',
        function: {
          name: schema.name.replace('.', '_'), // OpenAI-safe naming
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
      .map(name => this.schema().get(name))
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

      case 'claude':
      case 'anthropic': {
        const claudeOptions = options as OpenAIConfig; // Same config shape for now
        if (!claudeOptions.apiKey) {
          throw new Error('Claude provider requires apiKey');
        }
        return new Claude(claudeOptions);
      }

      case 'deepseek': {
        const deepseekOptions = options as OpenAIConfig; // Same config shape as OpenAI
        if (!deepseekOptions.apiKey) {
          throw new Error('DeepSeek provider requires apiKey');
        }
        return new DeepSeek(deepseekOptions);
      }

      case 'grok': {
        const grokOptions = options as OpenAIConfig; // Same config shape as OpenAI
        if (!grokOptions.apiKey) {
          throw new Error('Grok provider requires apiKey');
        }
        return new Grok(grokOptions);
      }

      case 'gemini': {
        const geminiOptions = options as OpenAIConfig; // Same config shape for now
        if (!geminiOptions.apiKey) {
          throw new Error('Gemini provider requires apiKey');
        }
        return new Gemini(geminiOptions);
      }

      case 'bedrock': {
       
        throw new Error('Bedrock provider not implemented yet');
       
      }

      case 'mistral': {
        const mistralOptions = options as MistralConfig;
        if (!mistralOptions.apiKey) {
          throw new Error('Mistral provider requires apiKey');
        }
        return new Mistral(mistralOptions.apiKey, mistralOptions.model);
      }

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
