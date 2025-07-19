// 專案類型定義

// 配置相關類型
export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface ConfigUpdateRequest {
  key: string;
  value: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors?: string[];
}

// 任務日誌相關類型
export interface TaskLog {
  id: number;
  task_type: string;
  status: 'success' | 'error' | 'pending' | 'running';
  message?: string;
  details?: string;
  created_at: string;
}

// API 回應類型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// AI 相關類型
export interface AIRequest {
  message: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Telegram 相關類型
export interface TelegramMessage {
  password: string;
  message: string;
  channel_id: string;
}

export interface TelegramConfig {
  apiUrl: string;
  botPassword: string;
  channelId: string;
  messageTemplate: string;
}

// 定時任務相關類型
export interface ScheduleTask {
  id?: number;
  name: string;
  cronExpression: string;
  message: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

// 錯誤類型
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 工具類型
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;