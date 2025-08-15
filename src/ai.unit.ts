import { Unit, createUnitSchema } from "@synet/unit";
import type {
  UnitProps,
  TeachingContract,
  ToolSchema,
  UnitCore,
  Capabilities,
  Schema,
  Validator,
} from "@synet/unit";
import {
  Capabilities as CapabilitiesClass,
  Schema as SchemaClass,
  Validator as ValidatorClass,
} from "@synet/unit";
import { OpenAI } from "./providers/openai.js";
import { Claude } from "./providers/claude.js";
import { DeepSeek } from "./providers/deepseek.js";
import { Grok } from "./providers/grok.js";
import { Gemini } from "./providers/gemini.js";
import { Mistral } from "./providers/mistral.js";
import { OpenRouter } from "./providers/openrouter.js";
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
  MistralConfig,
} from "./types.js";

export interface AIProps extends UnitProps {
  provider: IAI;
  providerType: AIProviderType;
  config: Record<string, unknown>;
}

export interface AIConfig<T extends AIProviderType = AIProviderType> {
  type: T;
  options: T extends "openai"
    ? OpenAIConfig
    : T extends "bedrock"
      ? BedrockConfig
      : Record<string, unknown>;
}

interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
  error?: string;
}


export const VERSION = "1.0.5";
export class AIOperator extends Unit<AIProps> implements IAI {
  protected constructor(props: AIProps) {
    super(props);
  }

  // =============================================================================
  // CONSCIOUSNESS TRINITY - v1.0.7
  // =============================================================================

  /**
   * Build consciousness trinity - creates living instances once
   * AI Unit is a tool-caller, not a tool itself - no capabilities or schemas to teach
   */
  protected build(): UnitCore {
    // AI unit has no teachable capabilities - it's the orchestrator
    const capabilities = CapabilitiesClass.create(this.dna.id, {});

    // AI unit has no schemas - it calls tools, doesn't become one
    const schema = SchemaClass.create(this.dna.id, {});

    const validator = ValidatorClass.create({
      unitId: this.dna.id,
      capabilities,
      schema,
      strictMode: false,
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
        id: "ai",
        version: VERSION,
      }),
      provider: backend,
      providerType: config.type,
      config: { ...config.options } as Record<string, unknown>,
    };

    return new AIOperator(props);
  }

  // =============================================================================
  // ENHANCED IAI INTERFACE (v1.0.6 Clean Architecture)
  // =============================================================================

  /**
   * Simple AI query with optional tools
   */
  async ask(
    prompt: string,
    options?: AskOptions & { tools?: ToolDefinition[] },
  ): Promise<AIResponse> {
    const allTools = options?.tools || [];

    if (allTools.length > 0) {
      // TypeScript needs explicit typing for systemPrompt
      const extendedOptions = options as AskOptions & {
        tools?: ToolDefinition[];
        systemPrompt?: string;
      };
      return this.props.provider.tools(allTools, {
        prompt,
        systemPrompt: extendedOptions?.systemPrompt,
        metadata: options?.metadata,
      });
    }

    return this.props.provider.ask(prompt, options);
  }

  /**
   * Conversational AI with optional tools
   */
  async chat(
    messages: ChatMessage[],
    options?: ChatOptions & { tools?: ToolDefinition[] },
  ): Promise<AIResponse> {
    if (options?.tools?.length) {
      // Convert to tools call
      const lastMessage = messages[messages.length - 1];
      return this.props.provider.tools(options.tools, {
        prompt: lastMessage.content,
        systemPrompt: options.systemPrompt,
        metadata: options.metadata,
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
      const toolResults = await this.executeToolCalls(
        initialResponse.toolCalls,
      );

      // Step 3: Continue conversation with tool results
      const messages: ChatMessage[] = [{ role: "user", content: prompt }];

      // Only add assistant message if it has content (avoid empty messages for Mistral)
      if (initialResponse.content?.trim()) {
        messages.push({
          role: "assistant",
          content: initialResponse.content,
          metadata: { toolCalls: initialResponse.toolCalls },
        });
      }

      messages.push({
        role: "user",
        content: `Tool results:\n${toolResults.map((r: ToolExecutionResult) => `${r.toolName}: ${JSON.stringify(r.result)}`).join("\n")}`,
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
   * Chat with automatic tool execution using learned capabilities
   * This is what Smith needs for worker memory + tools
   */
  async chatWithTools(
    messages: ChatMessage[],
    options?: CallOptions,
  ): Promise<AIResponse> {
    let tools: ToolDefinition[] = options?.tools || [];

    // Always use learned tools for chatWithTools
    tools = [...tools, ...this.convertSchemasToTools()];

    // Step 1: Make initial chat call with tools
    const lastMessage = messages[messages.length - 1];
    const askOptions = {
      ...options,
      tools,
      ...(messages[0].role === "system"
        ? { systemPrompt: messages[0].content }
        : {}),
    } as AskOptions & { tools?: ToolDefinition[] };

    const initialResponse = await this.ask(lastMessage.content, askOptions);

    // Step 2: If AI made tool calls, execute them and continue conversation
    if (initialResponse.toolCalls && initialResponse.toolCalls.length > 0) {
      const toolResults = await this.executeToolCalls(
        initialResponse.toolCalls,
      );

      // Step 3: Continue conversation with tool results
      const extendedMessages: ChatMessage[] = [...messages];

      // Only add assistant message if it has content
      if (initialResponse.content?.trim()) {
        extendedMessages.push({
          role: "assistant",
          content: initialResponse.content,
          metadata: { toolCalls: initialResponse.toolCalls },
        });
      }

      extendedMessages.push({
        role: "user",
        content: `Tool results:\n${toolResults.map((r: ToolExecutionResult) => `${r.toolName}: ${JSON.stringify(r.result)}`).join("\n")}`,
      });

      // Get final response with tool results
      const finalResponse = await this.chat(extendedMessages, options);

      // PRESERVE the original tool calls in the final response
      finalResponse.toolCalls = initialResponse.toolCalls;

      return finalResponse;
    }

    return initialResponse;
  }

  /**
   * Direct provider tool calling (legacy compatibility)
   */
  async tools(
    toolDefinitions: ToolDefinition[],
    request: ToolsRequest,
  ): Promise<AIResponse> {
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
      validator: this._unit.validator,
    };
  }

  help(): void {
    console.log(`
AI Unit - Intelligent Operations with Unit Architecture

CORE CAPABILITIES:
• ask(prompt) - Simple AI query
• chat(messages) - Conversational AI  
• call(prompt, options) - AI with learned tools 🔥
• chatWithTools(messages) - Chat with automatic tool execution 🔥
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
  private async executeToolCalls(
    toolCalls: ToolCall[],
  ): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        // Convert OpenAI tool name back to capability name (reverse the underscore replacement)
        const capabilityName = toolCall.function.name.replace("_", ".");

        if (!this.can(capabilityName)) {
          results.push({
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            result: null,
            error: `Capability '${capabilityName}' not found`,
          });
          continue;
        }

        // Execute the capability with the provided arguments
        let parsedArgs: Record<string, unknown>;

        // Handle both string and object arguments (different providers return different formats)
        if (typeof toolCall.function.arguments === "string") {
          parsedArgs = JSON.parse(toolCall.function.arguments);
        } else {
          parsedArgs = toolCall.function.arguments;
        }

        console.log(
          `🔧 [AI Unit] Executing ${capabilityName} with args:`,
          parsedArgs,
        );

        try {
          // Pass the parsed arguments object directly (Unit capabilities expect object as first parameter)
          const result = await this.execute(capabilityName, parsedArgs);

          results.push({
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            result,
            error: undefined,
          });
        } catch (execError) {
          results.push({
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            result: null,
            error:
              execError instanceof Error
                ? execError.message
                : "Unknown execution error",
          });
        }
      } catch (error) {
        results.push({
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          result: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  // =============================================================================
  // TOOL SCHEMA CONVERSION (Unit Architecture v1.0.6)
  // =============================================================================

  /**
   * Convert all learned schemas to tool definitions (excluding AI's own methods)
   */
  private convertSchemasToTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];

    for (const schema of this.schema().toArray()) {
      // Skip AI unit's own native methods - only include learned capabilities
      if (schema.name.includes(".")) {
        tools.push({
          type: "function",
          function: {
            name: schema.name.replace(".", "_"), // OpenAI-safe naming
            description: schema.description,
            parameters: schema.parameters,
          },
        });
      }
    }

    return tools;
  }

  /**
   * Convert specific schemas to tool definitions
   */
  private convertSpecificSchemas(schemaNames: string[]): ToolDefinition[] {
    return schemaNames
      .map((name) => this.schema().get(name))
      .filter((schema): schema is NonNullable<typeof schema> => Boolean(schema))
      .map((schema) => ({
        type: "function" as const,
        function: {
          name: schema.name.replace(".", "_"),
          description: schema.description,
          parameters: schema.parameters,
        },
      }));
  }

  // =============================================================================
  // PROVIDER FACTORY (following @synet/fs pattern)
  // =============================================================================

  /**
   * Create specific AI backend
   */
  private static createBackend<T extends AIProviderType>(
    config: AIConfig<T>,
  ): IAI {
    const { type, options } = config;

    switch (type) {
      case "openai": {
        const openaiOptions = options as OpenAIConfig;
        if (!openaiOptions.apiKey) {
          throw new Error("OpenAI provider requires apiKey");
        }
        return new OpenAI(openaiOptions);
      }

      case "claude":
      case "anthropic": {
        const claudeOptions = options as OpenAIConfig; // Same config shape for now
        if (!claudeOptions.apiKey) {
          throw new Error("Claude provider requires apiKey");
        }
        return new Claude(claudeOptions);
      }

      case "deepseek": {
        const deepseekOptions = options as OpenAIConfig; // Same config shape as OpenAI
        if (!deepseekOptions.apiKey) {
          throw new Error("DeepSeek provider requires apiKey");
        }
        return new DeepSeek(deepseekOptions);
      }

      case "grok": {
        const grokOptions = options as OpenAIConfig; // Same config shape as OpenAI
        if (!grokOptions.apiKey) {
          throw new Error("Grok provider requires apiKey");
        }
        return new Grok(grokOptions);
      }

      case "gemini": {
        const geminiOptions = options as OpenAIConfig; // Same config shape for now
        if (!geminiOptions.apiKey) {
          throw new Error("Gemini provider requires apiKey");
        }
        return new Gemini(geminiOptions);
      }

      case "bedrock": {
        throw new Error("Bedrock provider not implemented yet");
      }

      case "mistral": {
        const mistralOptions = options as MistralConfig;
        if (!mistralOptions.apiKey) {
          throw new Error("Mistral provider requires apiKey");
        }
        return new Mistral(mistralOptions.apiKey, mistralOptions.model);
      }

      case "openrouter": {
        const openrouterOptions = options as OpenAIConfig; // Same config shape as OpenAI
        if (!openrouterOptions.apiKey) {
          throw new Error("OpenRouter provider requires apiKey");
        }
        return new OpenRouter(openrouterOptions);
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
