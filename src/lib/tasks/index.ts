// 任務系統入口檔案
export { TaskHandler } from './TaskHandler';
export type { TaskContext, TaskResult, TaskTypeInfo } from './TaskHandler';
export { TaskRegistry } from './TaskRegistry';

// 任務處理器
export { DailyMessageTask } from './handlers/DailyMessageTask';

// 註冊所有任務處理器
import { TaskRegistry } from './TaskRegistry';
import { DailyMessageTask } from './handlers/DailyMessageTask';

// 初始化任務註冊系統
let initialized = false;
export function initTaskSystem() {
  try {
    if (initialized) return;
    
    // 註冊所有任務處理器
    if (!TaskRegistry.isRegistered('daily_message')) {
      TaskRegistry.register(new DailyMessageTask());
    }
    
    initialized = true;
    
    console.log(`任務系統初始化完成，已註冊 ${TaskRegistry.getRegisteredCount()} 個任務類型:`);
    TaskRegistry.getRegisteredTaskTypes().forEach(taskType => {
      console.log(`- ${taskType}`);
    });
  } catch (error) {
    console.error('任務系統初始化失敗:', error);
    throw error;
  }
}

// 獲取任務執行器
export function getTaskExecutor(taskType: string) {
  const handler = TaskRegistry.getHandler(taskType);
  if (!handler) {
    throw new Error(`未找到任務類型 '${taskType}' 的處理器`);
  }
  return handler;
}

// 驗證任務配置
export function validateTaskConfig(taskType: string, config: any) {
  return TaskRegistry.validateTaskConfig(taskType, config);
}

// 獲取任務類型列表
export function getAvailableTaskTypes() {
  return TaskRegistry.getAllTaskTypes();
}

// 獲取任務預設配置
export function getTaskDefaultConfig(taskType: string) {
  return TaskRegistry.getDefaultConfig(taskType);
}

// 獲取任務配置結構
export function getTaskConfigSchema(taskType: string) {
  return TaskRegistry.getConfigSchema(taskType);
}