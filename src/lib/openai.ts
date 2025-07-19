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

    // 處理完整的 API 端點 URL，轉換為 baseURL
    let baseURL = 'https://openrouter.ai/api/v1';
    if (apiUrl) {
      if (apiUrl.includes('/chat/completions')) {
        // 如果是完整的端點 URL，移除 /chat/completions 部分
        baseURL = apiUrl.replace('/chat/completions', '');
      } else {
        // 如果已經是 baseURL 格式，直接使用
        baseURL = apiUrl;
      }
    }

    console.log('初始化 OpenAI 客戶端:', { baseURL, hasApiKey: !!apiKey });

    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  // 發送訊息到 OpenAI（帶重試機制）
  async sendMessage(message: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    enableWebSearch?: boolean;
    maxRetries?: number;
    retryDelay?: number;
  }): Promise<string> {
    if (!this.client) {
      this.initializeClient();
    }

    if (!this.client) {
      throw new Error('無法初始化 OpenAI 客戶端');
    }

    const maxRetries = options?.maxRetries || 3;
    const baseRetryDelay = options?.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = options?.model || getConfig('openai_model') || 'gpt-3.5-turbo';
        
        // 建立訊息陣列
        const messages: any[] = [
          {
            role: 'user',
            content: message
          }
        ];

        // 如果啟用 web search，加入系統提示
        if (options?.enableWebSearch) {
          messages.unshift({
            role: 'system',
            content: '你可以使用網路搜尋來獲取最新資訊。請提供準確且有用的回應。'
          });
        }

        const requestData: any = {
          model,
          messages,
          max_tokens: options?.maxTokens || 150,
          temperature: options?.temperature || 0.7,
        };

        // 如果啟用 web search，針對不同的 API 提供商使用不同的實作
        if (options?.enableWebSearch) {
          const baseURL = this.client?.baseURL || '';
          
          if (baseURL.includes('openrouter.ai')) {
            // OpenRouter 不需要特殊的 web search 參數，模型本身可能支援
            console.log('OpenRouter API: 依賴模型本身的搜尋能力');
          } else {
            // 其他 API 提供商的 web search 實作
            requestData.tools = [
              {
                type: 'web_search',
                web_search: {
                  enable: true
                }
              }
            ];
          }
        }

        console.log(`發送請求到 OpenAI API (嘗試 ${attempt}/${maxRetries}):`, {
          model,
          messageLength: message.length,
          enableWebSearch: options?.enableWebSearch || false
        });

        const response = await this.client.chat.completions.create(requestData);

        return response.choices[0]?.message?.content || '無回應';
      } catch (error: any) {
        console.error(`OpenAI API 錯誤 (嘗試 ${attempt}/${maxRetries}):`, error);
        
        // 檢查是否為 429 錯誤（請求頻率過高）
        if (error.status === 429 && attempt < maxRetries) {
          // 指數退避策略：每次重試延遲時間翻倍
          const retryDelay = baseRetryDelay * Math.pow(2, attempt - 1);
          console.log(`遇到 429 錯誤，${retryDelay}ms 後重試...`);
          await this.sleep(retryDelay);
          continue;
        }
        
        // 檢查是否為其他可重試的錯誤
        if (this.isRetryableError(error) && attempt < maxRetries) {
          const retryDelay = baseRetryDelay * attempt;
          console.log(`遇到可重試錯誤，${retryDelay}ms 後重試...`);
          await this.sleep(retryDelay);
          continue;
        }
        
        // 如果是最後一次嘗試或不可重試的錯誤，拋出異常
        throw new Error(`OpenAI API 錯誤 (${attempt}/${maxRetries} 次嘗試): ${error.message}`);
      }
    }
    
    throw new Error('所有重試嘗試都失敗了');
  }

  // 判斷錯誤是否可重試
  private isRetryableError(error: any): boolean {
    // 429: 請求頻率過高
    // 500, 502, 503, 504: 伺服器錯誤
    // ECONNRESET, ETIMEDOUT: 網路錯誤
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    const retryableErrorCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
    
    return retryableStatusCodes.includes(error.status) ||
           retryableErrorCodes.includes(error.code) ||
           error.message?.includes('timeout') ||
           error.message?.includes('network');
  }

  // 延遲函數
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 測試連線
  async testConnection(apiUrl?: string, apiKey?: string, model?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 處理 API URL
      let baseURL = 'https://api.openai.com/v1';
      const configuredUrl = apiUrl || getConfig('openai_api_url');
      
      if (configuredUrl) {
        if (configuredUrl.includes('/chat/completions')) {
          baseURL = configuredUrl.replace('/chat/completions', '');
        } else {
          baseURL = configuredUrl;
        }
      }

      const testClient = new OpenAI({
        baseURL,
        apiKey: apiKey || getConfig('openai_api_key') || '',
      });

      const testModel = model || getConfig('openai_model') || 'gpt-3.5-turbo';
      
      console.log('測試 OpenAI 連線:', { baseURL, model: testModel });
      
      await testClient.chat.completions.create({
        model: testModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('OpenAI 連線測試失敗:', error);
      return { success: false, error: error.message };
    }
  }
}

export const openaiClient = OpenAIClient.getInstance();