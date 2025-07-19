import { TaskHandler, TaskContext, TaskResult } from '../TaskHandler';
import { openaiClient } from '../../openai';
import { telegramClient } from '../../telegram';
import { addLog } from '../../db';
import { getConfig } from '../../config';

export class DailyMessageTask extends TaskHandler {
  readonly taskType = 'daily_message';
  readonly name = '每日訊息';
  readonly description = '使用 AI 生成每日訊息並發送到 Telegram';

  getConfigSchema(): object {
    return {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          default: '請提供今日的一句話',
          description: '發送給 AI 的提示訊息'
        },
        aiModel: {
          type: 'string',
          enum: ['deepseek/deepseek-chat-v3-0324:free', 'deepseek/deepseek-chat-v3-0324:free'],
          default: 'deepseek/deepseek-chat-v3-0324:free',
          description: 'AI 模型選擇'
        },
        telegramChannels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Telegram 頻道 ID 列表'
        },
        messageTemplate: {
          type: 'string',
          default: '{ai_response}',
          description: '訊息模板，使用 {ai_response} 作為 AI 回應的佔位符'
        },
        includeTimestamp: {
          type: 'boolean',
          default: false,
          description: '是否在訊息中包含時間戳'
        }
      },
      required: ['prompt']
    };
  }

  getDefaultConfig(): object {
    return {
      prompt: '請提供今日的一句話',
      aiModel: 'deepseek/deepseek-chat-v3-0324:free',
      messageTemplate: '{ai_response}',
      includeTimestamp: false
    };
  }

  async execute(context: TaskContext): Promise<TaskResult> {
    const { taskId, config } = context;
    
    try {
      // 記錄任務開始
      addLog(`task_${taskId}`, 'info', `開始執行每日訊息任務`);

      // 1. 呼叫 OpenAI API (啟用 web search)
      // 使用配置中的模型，如果沒有設定則使用系統配置的模型
      const modelToUse = config.aiModel || getConfig('openai_model') || 'gpt-3.5-turbo';
      console.log('使用的模型:', modelToUse);
      
      // 加入當前日期和時間到 prompt 中
      const currentDateTime = new Date().toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long'
      });
      
      const enhancedPrompt = `當前時間：${currentDateTime}\n\n${config.prompt}`;
      console.log('增強後的 prompt:', enhancedPrompt);
      
      const aiResponse = await this.callOpenAI(enhancedPrompt, modelToUse, true);
      
      if (!aiResponse || aiResponse === '無回應') {
        return {
          success: false,
          error: 'OpenAI API 呼叫失敗或無回應',
          shouldRetry: true
        };
      }

      // 2. 格式化訊息
      let message = this.formatMessage(aiResponse, config);

      // 3. 發送到 Telegram
      const telegramResult = await this.sendToTelegram(message, config.telegramChannels);
      
      if (!telegramResult.success) {
        return {
          success: false,
          error: `發送到 Telegram 失敗: ${telegramResult.error}`,
          data: { aiResponse, message },
          shouldRetry: true
        };
      }

      // 記錄成功
      addLog(`task_${taskId}`, 'success', `任務完成: ${message}`);

      return {
        success: true,
        data: {
          aiResponse,
          formattedMessage: message,
          telegramResult: telegramResult.data
        },
        message: '每日訊息發送成功'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      addLog(`task_${taskId}`, 'error', `任務執行失敗: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        shouldRetry: true
      };
    }
  }

  private async callOpenAI(prompt: string, model: string = 'gpt-3.5-turbo', enableWebSearch: boolean = false): Promise<string | null> {
    try {
      // 檢查 prompt 是否為空
      if (!prompt || prompt.trim() === '') {
        console.error('Prompt 為空，使用預設 prompt');
        prompt = '請提供今日的一句話';
      }
      
      console.log('發送 prompt 到 OpenAI:', prompt, '| Web Search:', enableWebSearch);
      return await openaiClient.sendMessage(prompt, {
        model,
        enableWebSearch
      });
    } catch (error) {
      console.error('OpenAI API 呼叫失敗:', error);
      return null;
    }
  }

  private formatMessage(aiResponse: string, config: any): string {
    let message = config.messageTemplate || '{ai_response}';
    
    // 替換 AI 回應
    message = message.replace(/{ai_response}/g, aiResponse);
    
    // 如果需要包含時間戳
    if (config.includeTimestamp) {
      const timestamp = new Date().toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      message = `${message}\n\n📅 ${timestamp}`;
    }
    
    return message;
  }

  private async sendToTelegram(message: string, channels?: string[]): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // 如果有指定頻道，發送到指定頻道
      if (channels && channels.length > 0) {
        const results = [];
        for (const channelId of channels) {
          const result = await telegramClient.sendMessage(message);
          results.push({ channelId, result });
        }
        return {
          success: results.every(r => r.result.success),
          data: results
        };
      } else {
        // 使用預設設定發送
        const result = await telegramClient.sendMessage(message);
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '發送失敗'
      };
    }
  }

  async onBeforeExecute(context: TaskContext): Promise<void> {
    addLog(`task_${context.taskId}`, 'info', `準備執行每日訊息任務 (執行ID: ${context.executionId})`);
  }

  async onAfterExecute(result: TaskResult, context: TaskContext): Promise<void> {
    const status = result.success ? 'success' : 'failed';
    const message = result.success ? '任務執行完成' : `任務執行失敗: ${result.error}`;
    addLog(`task_${context.taskId}`, status, message);
  }

  async onError(error: Error, context: TaskContext): Promise<void> {
    addLog(`task_${context.taskId}`, 'error', `任務執行異常: ${error.message}`);
  }
}