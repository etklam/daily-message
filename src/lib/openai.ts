import OpenAI from 'openai';
import { getConfig } from './config';

// OpenAI 客戶端配置
export class OpenAIClient {
  private client: OpenAI | null = null;
  private static instance: OpenAIClient;

  public static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  // 初始化客戶端
  private initializeClient(): void {
    const apiKey = getConfig('openai_api_key');
    const apiUrl = getConfig('openai_api_url');

    if (!apiKey) {
      throw new Error('OpenAI API 金鑰未配置');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: apiUrl || 'https://api.openai.com/v1',
    });
  }

  // 發送訊息到 OpenAI
  async sendMessage(message: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    if (!this.client) {
      this.initializeClient();
    }

    if (!this.client) {
      throw new Error('無法初始化 OpenAI 客戶端');
    }

    try {
      const model = options?.model || getConfig('openai_model') || 'gpt-3.5-turbo';
      
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: options?.maxTokens || 150,
        temperature: options?.temperature || 0.7,
      });

      return response.choices[0]?.message?.content || '無回應';
    } catch (error: any) {
      throw new Error(`OpenAI API 錯誤: ${error.message}`);
    }
  }

  // 測試連線
  async testConnection(apiUrl?: string, apiKey?: string, model?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const testClient = new OpenAI({
        baseURL: apiUrl || getConfig('openai_api_url') || 'https://api.openai.com/v1',
        apiKey: apiKey || getConfig('openai_api_key') || '',
      });

      const testModel = model || getConfig('openai_model') || 'gpt-3.5-turbo';
      
      await testClient.chat.completions.create({
        model: testModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const openaiClient = OpenAIClient.getInstance();