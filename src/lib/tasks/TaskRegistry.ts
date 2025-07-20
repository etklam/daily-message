import { TaskHandler, TaskTypeInfo } from './TaskHandler';

// 任務註冊系統
export class TaskRegistry {
  private static handlers: Map<string, TaskHandler> = new Map();

  // 註冊任務處理器
static register(handler: TaskHandler): void {
  if (this.handlers.has(handler.taskType)) {
    // 在開發環境中允許重複註冊相同類型的處理器
    const existingHandler = this.handlers.get(handler.taskType);
    if (existingHandler?.constructor === handler.constructor) {
      // 遇到相同的處理器，靜默跳過避免錯誤
      return;
    }
    throw new Error(`任務類型 '${handler.taskType}' 已經註冊`);
  }
  this.handlers.set(handler.taskType, handler);
  console.log(`已註冊任務類型: ${handler.taskType} (${handler.name})`);
}

  // 獲取任務處理器
  static getHandler(taskType: string): TaskHandler | undefined {
    return this.handlers.get(taskType);
  }

  // 獲取所有已註冊的任務類型資訊
  static getAllTaskTypes(): TaskTypeInfo[] {
    return Array.from(this.handlers.values()).map(handler => handler.getTaskTypeInfo());
  }

  // 檢查任務類型是否已註冊
  static isRegistered(taskType: string): boolean {
    return this.handlers.has(taskType);
  }

  // 取消註冊任務類型
  static unregister(taskType: string): boolean {
    return this.handlers.delete(taskType);
  }

  // 獲取已註冊的任務類型數量
  static getRegisteredCount(): number {
    return this.handlers.size;
  }

  // 獲取所有已註冊的任務類型ID
  static getRegisteredTaskTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  // 驗證任務配置
  static validateTaskConfig(taskType: string, config: any): { valid: boolean; errors?: string[] } {
    const handler = this.getHandler(taskType);
    if (!handler) {
      return {
        valid: false,
        errors: [`未知的任務類型: ${taskType}`]
      };
    }
    return handler.validateConfig(config);
  }

  // 獲取任務類型的預設配置
  static getDefaultConfig(taskType: string): any {
    const handler = this.getHandler(taskType);
    return handler ? handler.getDefaultConfig() : null;
  }

  // 獲取任務類型的配置結構
  static getConfigSchema(taskType: string): object | null {
    const handler = this.getHandler(taskType);
    return handler ? handler.getConfigSchema() : null;
  }
}