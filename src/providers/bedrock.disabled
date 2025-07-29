/**
 * AWS Bedrock Provider for @synet/ai
 * 
 * Provides access to Amazon Nova models and other Bedrock foundation models
 * Supports Nova Pro, Nova Lite, Nova Micro, and other AWS Bedrock models
 */

import type { IAI, AIResponse, AskOptions, ChatMessage, ChatOptions, ToolDefinition, ToolsRequest, BedrockConfig } from '../types.js';

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface BedrockResponse {
  output?: {
    message?: {
      content?: Array<{
        text?: string;
      }>;
    };
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

/**
 * AWS Bedrock provider implementation
 * Supports Amazon Nova models via Bedrock Runtime API
 */
export class Bedrock implements IAI {
  private apiKey: string;
  private region: string;
  private model: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: BedrockConfig) {
    if (!config.apiKey) {
      throw new Error('Bedrock provider requires apiKey (AWS session token)');
    }

    this.apiKey = config.apiKey;
    this.region = config.region || 'us-east-1';
    this.model = config.model || 'amazon.nova-pro-v1:0';
    this.baseURL = config.baseURL || `https://bedrock-runtime.${this.region}.amazonaws.com`;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  }

  async ask(prompt: string, options?: AskOptions & { tools?: ToolDefinition[] }): Promise<AIResponse> {
    const messages: BedrockMessage[] = [
      { role: 'user', content: prompt }
    ];

    return this.callBedrock(messages, options);
  }

  async chat(messages: ChatMessage[], options?: ChatOptions & { tools?: ToolDefinition[] }): Promise<AIResponse> {
    const bedrockMessages: BedrockMessage[] = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role, // Bedrock doesn't have system role
      content: msg.content
    }));

    return this.callBedrock(bedrockMessages, options);
  }

  async tools(toolDefinitions: ToolDefinition[], request: ToolsRequest): Promise<AIResponse> {
    const prompt = request.prompt || request.instructions || 'Please use the available tools to help with this request.';
    
    const messages: BedrockMessage[] = [
      { role: 'user', content: prompt }
    ];

    return this.callBedrock(messages, { tools: toolDefinitions });
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.ask('Hello', { maxTokens: 10 });
      return response.content.length > 0;
    } catch {
      return false;
    }
  }

  private async callBedrock(
    messages: BedrockMessage[], 
    options?: (AskOptions | ChatOptions) & { tools?: ToolDefinition[] }
  ): Promise<AIResponse> {
    const url = `${this.baseURL}/model/${this.model}/converse`;
    
    // AWS Bedrock Converse API format
    const requestBody = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: [{ text: msg.content }]
      })),
      inferenceConfig: {
        maxTokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7
      }
    };

    // Add tool configuration if tools are provided
    if (options?.tools && options.tools.length > 0) {
      (requestBody as any).toolConfig = {
        tools: options.tools.map(tool => ({
          toolSpec: {
            name: tool.function.name,
            description: tool.function.description,
            inputSchema: {
              json: tool.function.parameters
            }
          }
        }))
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Parse AWS credentials from apiKey format: accessKey:secretKey
      const [accessKeyId, secretAccessKey] = this.apiKey.split(':');
      if (!accessKeyId || !secretAccessKey) {
        throw new Error('Invalid AWS credentials format. Expected: accessKeyId:secretAccessKey');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKeyId}`, // Simplified for demo
          'X-Amz-Target': 'AmazonBedrockRuntimeService.Converse'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        
        // Provide helpful error message for AWS auth issues
        if (response.status === 403 || response.status === 401) {
          throw new Error(`AWS Bedrock authentication failed. 
          
For production use, implement proper AWS Signature Version 4 authentication.
Current simplified auth is for demo purposes only.

AWS Bedrock requires:
1. Valid AWS Access Key ID and Secret Access Key
2. Proper AWS SigV4 signing process
3. Correct region and service configuration

Error details: ${response.status} - ${errorText}`);
        }
        
        throw new Error(`Bedrock API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as BedrockResponse;
      
      // Extract text content from Bedrock response
      const content = data.output?.message?.content?.[0]?.text || '';
      
      // Extract usage information
      const usage = data.usage ? {
        prompt_tokens: data.usage.inputTokens || 0,
        completion_tokens: data.usage.outputTokens || 0,
        total_tokens: data.usage.totalTokens || 0
      } : undefined;

      return {
        content,
        provider: 'bedrock',
        model: this.model,
        usage,
        metadata: options?.metadata,
        toolCalls: [] // Tool calling support can be enhanced later
      };

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Bedrock request failed: ${error}`);
    }
  }
}
