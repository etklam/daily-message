// 任務執行上下文
export interface TaskContext {
  taskId: number;
  executionId: string;
  config: any;
  retryCount: number;
  startTime: Date;
}

// 任務執行結果
export interface TaskResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  shouldRetry?: boolean;
}

// 配置驗證結果
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// 任務類型資訊
export interface TaskTypeInfo {
  id: string;
  name: string;
  description: string;
  configSchema: object;
  defaultConfig: object;
}

// 抽象任務處理器基礎類
export abstract class TaskHandler {
  abstract readonly taskType: string;
  abstract readonly name: string;
  abstract readonly description: string;

  // 獲取配置結構定義
  abstract getConfigSchema(): object;
  
  // 獲取預設配置
  abstract getDefaultConfig(): object;
  
  // 執行任務的主要邏輯
  abstract execute(context: TaskContext): Promise<TaskResult>;

  // 驗證配置
  validateConfig(config: any): ValidationResult {
    try {
      // 基本驗證邏輯，子類可以覆寫
      const schema = this.getConfigSchema();
      return this.validateAgainstSchema(config, schema);
    } catch (error) {
      return {
        valid: false,
        errors: [`配置驗證失敗: ${error instanceof Error ? error.message : '未知錯誤'}`]
      };
    }
  }

  // 簡單的 JSON Schema 驗證
  private validateAgainstSchema(config: any, schema: any): ValidationResult {
    const errors: string[] = [];
    
    if (schema.type === 'object' && schema.properties) {
      // 檢查必填欄位
      if (schema.required) {
        for (const field of schema.required) {
          if (config[field] === undefined || config[field] === null) {
            errors.push(`必填欄位 '${field}' 缺失`);
          }
        }
      }
      
      // 檢查欄位類型
      for (const [key, fieldSchema] of Object.entries(schema.properties as any)) {
        if (config[key] !== undefined) {
          const fieldType = (fieldSchema as any).type;
          const actualType = typeof config[key];
          
          if (fieldType === 'array' && !Array.isArray(config[key])) {
            errors.push(`欄位 '${key}' 應該是陣列類型`);
          } else if (fieldType !== 'array' && fieldType !== actualType) {
            errors.push(`欄位 '${key}' 應該是 ${fieldType} 類型，但實際是 ${actualType}`);
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // 生命週期鉤子：執行前
  async onBeforeExecute(context: TaskContext): Promise<void> {
    // 預設實現為空，子類可以覆寫
  }

  // 生命週期鉤子：執行後
  async onAfterExecute(result: TaskResult, context: TaskContext): Promise<void> {
    // 預設實現為空，子類可以覆寫
  }

  // 生命週期鉤子：錯誤處理
  async onError(error: Error, context: TaskContext): Promise<void> {
    // 預設實現為空，子類可以覆寫
  }

  // 獲取任務類型資訊
  getTaskTypeInfo(): TaskTypeInfo {
    return {
      id: this.taskType,
      name: this.name,
      description: this.description,
      configSchema: this.getConfigSchema(),
      defaultConfig: this.getDefaultConfig()
    };
  }
}