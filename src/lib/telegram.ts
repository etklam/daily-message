import axios from 'axios';
import { getConfig } from './config';

export class TelegramClient {
  private apiUrl: string;
  private password: string;
  private channelId: string;

  constructor() {
    this.apiUrl = getConfig('telegram_api_url') || '';
    this.password = getConfig('telegram_bot_password') || '';
    this.channelId = getConfig('telegram_channel_id') || '';
  }

  async sendMessage(message: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await axios.post(this.apiUrl, {
        password: this.password,
        message,
        channel_id: this.channelId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const testMessage = '測試訊息 - Daily Message Service';
    const result = await this.sendMessage(testMessage);
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  }
}

export const telegramClient = new TelegramClient();