import * as cron from 'node-cron';
import { getAllConfig } from './config';
import { addLog } from './db';
import { telegramClient } from './telegram';
import { openaiClient } from './openai';

let scheduledTask: cron.ScheduledTask | null = null;

// 啟動定時任務
export function startScheduler() {
  stopScheduler(); // 先停止現有的任務
  
  const config = getAllConfig();
  const cronExpression = config.schedule_time || '0 9 * * *';
  const timezone = config.timezone || 'Asia/Taipei';
  
  console.log(`啟動定時任務: ${cronExpression} (${timezone})`);
  
  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log('執行定時任務...');
    await executeDailyTask();
  }, {
    timezone: timezone
  });
}

// 停止定時任務
export function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('定時任務已停止');
  }
}

// 執行每日任務
async function executeDailyTask() {
  try {
    const config = getAllConfig();
    
    // 記錄任務開始
    addLog('daily_task', 'started', '開始執行每日任務');
    
    // 呼叫 OpenAI API
    const message = config.daily_message || '請提供今日的一句話';
    const aiResponse = await openaiClient.sendMessage(message);
    
    if (aiResponse && aiResponse !== '無回應') {
      // 發送到 Telegram
      const result = await telegramClient.sendMessage(aiResponse);
      
      if (result.success) {
        addLog('daily_task', 'success', `任務完成: ${aiResponse}`);
      } else {
        addLog('daily_task', 'failed', `發送到 Telegram 失敗: ${result.error || '未知錯誤'}`);
      }
    } else {
      addLog('daily_task', 'failed', 'OpenAI API 呼叫失敗');
    }
  } catch (error) {
    console.error('執行任務時發生錯誤:', error);
    addLog('daily_task', 'error', error instanceof Error ? error.message : '未知錯誤');
  }
}

// 立即執行任務（用於測試）
export async function executeTaskNow() {
  console.log('立即執行任務...');
  await executeDailyTask();
}

// 獲取當前排程狀態
export function getSchedulerStatus() {
  return {
    isRunning: scheduledTask !== null,
    task: scheduledTask || null
  };
}