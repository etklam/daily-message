import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync } from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');

// 確保資料目錄存在
try {
  mkdirSync(path.dirname(dbPath), { recursive: true });
} catch (error) {
  // 目錄已存在
}

// 建立資料庫連線
export const db = new Database(dbPath);

// 初始化資料庫
export function initDatabase() {
  // 建立系統配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 建立任務日誌表
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_type TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 建立任務執行記錄表
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      execution_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      duration_ms INTEGER,
      result_data TEXT,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id) ON DELETE CASCADE
    )
  `);

  // 建立任務類型表
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      config_schema TEXT,
      default_config TEXT,
      handler_class TEXT NOT NULL,
      is_enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 建立任務統計表
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      task_id INTEGER,
      total_executions INTEGER DEFAULT 0,
      successful_executions INTEGER DEFAULT 0,
      failed_executions INTEGER DEFAULT 0,
      avg_duration_ms INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
      UNIQUE(date, task_id)
    )
  `);

  // 建立排程任務表
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cron_expression TEXT NOT NULL,
      timezone TEXT DEFAULT 'Asia/Taipei',
      task_type TEXT NOT NULL DEFAULT 'daily_message',
      config TEXT,
      is_enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_execution_time DATETIME,
      next_execution_time DATETIME,
      execution_count INTEGER DEFAULT 0,
      failure_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      timeout_seconds INTEGER DEFAULT 300,
      priority INTEGER DEFAULT 0,
      tags TEXT
    )
  `);

  // 插入預設配置
  const defaultConfigs = [
    ['openai_api_url', 'https://api.openai.com/v1/chat/completions'],
    ['openai_model', 'gpt-3.5-turbo'],
    ['openai_timeout', '30000'],
    ['openai_retries', '3'],
    ['schedule_time', '0 9 * * *'],
    ['timezone', 'Asia/Taipei'],
    ['daily_message', '請提供今日的一句話'],
    ['telegram_api_url', 'https://tg-bot-python.hhhk.7182818.xyz/send-message'],
    ['telegram_bot_password', 'Ihave2jj'],
    ['telegram_channel_id', '585426653'],
    ['telegram_message_template', '{ai_response}']
  ];

  const insertStmt = db.prepare('INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)');
  defaultConfigs.forEach(([key, value]) => {
    insertStmt.run(key, value);
  });

  // 插入預設排程任務（如果不存在）
  const checkTaskStmt = db.prepare('SELECT COUNT(*) as count FROM scheduled_tasks');
  const taskCount = checkTaskStmt.get() as { count: number };
  
  if (taskCount.count === 0) {
    const defaultTask = {
      name: '每日訊息',
      description: '每天發送AI生成的每日訊息到Telegram',
      cron_expression: '0 9 * * *',
      timezone: 'Asia/Taipei',
      task_type: 'daily_message',
      config: JSON.stringify({
        daily_message: '請提供今日的一句話'
      }),
      is_enabled: 1
    };
    
    const insertTaskStmt = db.prepare(`
      INSERT INTO scheduled_tasks (name, description, cron_expression, timezone, task_type, config, is_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertTaskStmt.run(
      defaultTask.name,
      defaultTask.description,
      defaultTask.cron_expression,
      defaultTask.timezone,
      defaultTask.task_type,
      defaultTask.config,
      defaultTask.is_enabled
    );
  }

  // 建立索引以提升查詢效能
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled ON scheduled_tasks(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_execution ON scheduled_tasks(next_execution_time);
    CREATE INDEX IF NOT EXISTS idx_task_executions_task_id ON task_executions(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_executions_status ON task_executions(status);
    CREATE INDEX IF NOT EXISTS idx_task_executions_started_at ON task_executions(started_at);
    CREATE INDEX IF NOT EXISTS idx_task_logs_task_type ON task_logs(task_type);
    CREATE INDEX IF NOT EXISTS idx_task_statistics_date ON task_statistics(date);
  `);

  // 插入預設任務類型
  const defaultTaskTypes = [
    {
      id: 'daily_message',
      name: '每日訊息',
      description: '使用 AI 生成每日訊息並發送到 Telegram',
      config_schema: JSON.stringify({
        type: 'object',
        properties: {
          prompt: { type: 'string', default: '請提供今日的一句話' },
          aiModel: { type: 'string', enum: ['gpt-3.5-turbo', 'gpt-4'], default: 'gpt-3.5-turbo' },
          telegramChannels: { type: 'array', items: { type: 'string' } },
          messageTemplate: { type: 'string', default: '{ai_response}' }
        },
        required: ['prompt']
      }),
      default_config: JSON.stringify({
        prompt: '請提供今日的一句話',
        aiModel: 'gpt-3.5-turbo',
        messageTemplate: '{ai_response}'
      }),
      handler_class: 'DailyMessageTask'
    },
    {
      id: 'weather_report',
      name: '天氣報告',
      description: '獲取天氣資訊並發送報告',
      config_schema: JSON.stringify({
        type: 'object',
        properties: {
          locations: { type: 'array', items: { type: 'string' } },
          apiKey: { type: 'string' },
          includeForcast: { type: 'boolean', default: true },
          temperatureUnit: { type: 'string', enum: ['celsius', 'fahrenheit'], default: 'celsius' }
        },
        required: ['locations', 'apiKey']
      }),
      default_config: JSON.stringify({
        includeForcast: true,
        temperatureUnit: 'celsius'
      }),
      handler_class: 'WeatherReportTask'
    }
  ];

  const insertTaskTypeStmt = db.prepare(`
    INSERT OR IGNORE INTO task_types (id, name, description, config_schema, default_config, handler_class)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  defaultTaskTypes.forEach(taskType => {
    insertTaskTypeStmt.run(
      taskType.id,
      taskType.name,
      taskType.description,
      taskType.config_schema,
      taskType.default_config,
      taskType.handler_class
    );
  });
}

// ===== 介面定義 =====

// 排程任務介面
export interface ScheduledTask {
  id?: number;
  name: string;
  description?: string;
  cron_expression: string;
  timezone?: string;
  task_type: string;
  config?: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
  last_execution_time?: string;
  next_execution_time?: string;
  execution_count?: number;
  failure_count?: number;
  max_retries?: number;
  timeout_seconds?: number;
  priority?: number;
  tags?: string;
}

// 任務執行記錄介面
export interface TaskExecution {
  id?: number;
  task_id: number;
  execution_id: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  result_data?: string;
  error_message?: string;
  retry_count?: number;
}

// 任務類型介面
export interface TaskType {
  id: string;
  name: string;
  description?: string;
  config_schema?: string;
  default_config?: string;
  handler_class: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// 任務統計介面
export interface TaskStatistics {
  id?: number;
  date: string;
  task_id?: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_duration_ms: number;
  created_at?: string;
}

// ===== 日誌相關函數 =====

// 添加日誌
export function addLog(taskType: string, status: string, message?: string) {
  const stmt = db.prepare('INSERT INTO task_logs (task_type, status, message) VALUES (?, ?, ?)');
  stmt.run(taskType, status, message || '');
}

// 獲取日誌
export function getLogs(limit: number = 50) {
  const stmt = db.prepare(`
    SELECT * FROM task_logs 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(limit);
}

// 獲取最新日誌
export function getLatestLog() {
  const stmt = db.prepare(`
    SELECT * FROM task_logs 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  return stmt.get();
}

// ===== 排程任務相關函數 =====

// 新增排程任務
export function addScheduledTask(task: Omit<ScheduledTask, 'id' | 'created_at' | 'updated_at'>) {
  const stmt = db.prepare(`
    INSERT INTO scheduled_tasks (name, description, cron_expression, timezone, task_type, config, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    task.name,
    task.description || '',
    task.cron_expression,
    task.timezone || 'Asia/Taipei',
    task.task_type,
    task.config || '',
    task.is_enabled ? 1 : 0
  );
}

// 獲取所有排程任務
export function getAllScheduledTasks(): ScheduledTask[] {
  const stmt = db.prepare('SELECT * FROM scheduled_tasks ORDER BY created_at DESC');
  return stmt.all() as ScheduledTask[];
}

// 獲取啟用的排程任務
export function getEnabledScheduledTasks(): ScheduledTask[] {
  const stmt = db.prepare('SELECT * FROM scheduled_tasks WHERE is_enabled = 1 ORDER BY created_at DESC');
  return stmt.all() as ScheduledTask[];
}

// 根據ID獲取排程任務
export function getScheduledTaskById(id: number): ScheduledTask | undefined {
  const stmt = db.prepare('SELECT * FROM scheduled_tasks WHERE id = ?');
  return stmt.get(id) as ScheduledTask | undefined;
}

// 更新排程任務
export function updateScheduledTask(id: number, task: Partial<ScheduledTask>) {
  const fields = [];
  const values = [];
  
  if (task.name !== undefined) {
    fields.push('name = ?');
    values.push(task.name);
  }
  if (task.description !== undefined) {
    fields.push('description = ?');
    values.push(task.description);
  }
  if (task.cron_expression !== undefined) {
    fields.push('cron_expression = ?');
    values.push(task.cron_expression);
  }
  if (task.timezone !== undefined) {
    fields.push('timezone = ?');
    values.push(task.timezone);
  }
  if (task.task_type !== undefined) {
    fields.push('task_type = ?');
    values.push(task.task_type);
  }
  if (task.config !== undefined) {
    fields.push('config = ?');
    values.push(task.config);
  }
  if (task.is_enabled !== undefined) {
    fields.push('is_enabled = ?');
    values.push(task.is_enabled ? 1 : 0);
  }
  
  if (fields.length === 0) return;
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE scheduled_tasks SET ${fields.join(', ')} WHERE id = ?`);
  return stmt.run(...values);
}

// 刪除排程任務
export function deleteScheduledTask(id: number) {
  const stmt = db.prepare('DELETE FROM scheduled_tasks WHERE id = ?');
  return stmt.run(id);
}

// 切換排程任務啟用狀態
export function toggleScheduledTask(id: number, enabled: boolean) {
  const stmt = db.prepare('UPDATE scheduled_tasks SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(enabled ? 1 : 0, id);
}

// ===== 任務執行記錄相關函數 =====

// 新增任務執行記錄
export function addTaskExecution(execution: Omit<TaskExecution, 'id'>) {
  const stmt = db.prepare(`
    INSERT INTO task_executions (task_id, execution_id, status, started_at, completed_at, duration_ms, result_data, error_message, retry_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    execution.task_id,
    execution.execution_id,
    execution.status,
    execution.started_at || new Date().toISOString(),
    execution.completed_at,
    execution.duration_ms,
    execution.result_data || '',
    execution.error_message || '',
    execution.retry_count || 0
  );
}

// 獲取所有任務執行記錄
export function getAllTaskExecutions(): TaskExecution[] {
  const stmt = db.prepare('SELECT * FROM task_executions ORDER BY started_at DESC');
  return stmt.all() as TaskExecution[];
}

// 根據任務ID獲取執行記錄
export function getTaskExecutionsByTaskId(taskId: number): TaskExecution[] {
  const stmt = db.prepare('SELECT * FROM task_executions WHERE task_id = ? ORDER BY started_at DESC');
  return stmt.all(taskId) as TaskExecution[];
}

// 更新任務執行記錄
export function updateTaskExecution(id: number, execution: Partial<TaskExecution>) {
  const fields = [];
  const values = [];
  
  if (execution.status !== undefined) {
    fields.push('status = ?');
    values.push(execution.status);
  }
  if (execution.completed_at !== undefined) {
    fields.push('completed_at = ?');
    values.push(execution.completed_at);
  }
  if (execution.duration_ms !== undefined) {
    fields.push('duration_ms = ?');
    values.push(execution.duration_ms);
  }
  if (execution.result_data !== undefined) {
    fields.push('result_data = ?');
    values.push(execution.result_data);
  }
  if (execution.error_message !== undefined) {
    fields.push('error_message = ?');
    values.push(execution.error_message);
  }
  if (execution.retry_count !== undefined) {
    fields.push('retry_count = ?');
    values.push(execution.retry_count);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  const stmt = db.prepare(`UPDATE task_executions SET ${fields.join(', ')} WHERE id = ?`);
  return stmt.run(...values);
}

// ===== 任務類型相關函數 =====

// 獲取所有任務類型
export function getAllTaskTypes(): TaskType[] {
  const stmt = db.prepare('SELECT * FROM task_types ORDER BY name');
  return stmt.all() as TaskType[];
}

// 根據ID獲取任務類型
export function getTaskTypeById(id: string): TaskType | undefined {
  const stmt = db.prepare('SELECT * FROM task_types WHERE id = ?');
  return stmt.get(id) as TaskType | undefined;
}

// 新增任務類型
export function addTaskType(taskType: Omit<TaskType, 'created_at' | 'updated_at'>) {
  const stmt = db.prepare(`
    INSERT INTO task_types (id, name, description, config_schema, default_config, handler_class, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    taskType.id,
    taskType.name,
    taskType.description || '',
    taskType.config_schema || '',
    taskType.default_config || '',
    taskType.handler_class,
    taskType.is_enabled ? 1 : 0
  );
}

// 更新任務類型
export function updateTaskType(id: string, taskType: Partial<TaskType>) {
  const fields = [];
  const values = [];
  
  if (taskType.name !== undefined) {
    fields.push('name = ?');
    values.push(taskType.name);
  }
  if (taskType.description !== undefined) {
    fields.push('description = ?');
    values.push(taskType.description);
  }
  if (taskType.config_schema !== undefined) {
    fields.push('config_schema = ?');
    values.push(taskType.config_schema);
  }
  if (taskType.default_config !== undefined) {
    fields.push('default_config = ?');
    values.push(taskType.default_config);
  }
  if (taskType.handler_class !== undefined) {
    fields.push('handler_class = ?');
    values.push(taskType.handler_class);
  }
  if (taskType.is_enabled !== undefined) {
    fields.push('is_enabled = ?');
    values.push(taskType.is_enabled ? 1 : 0);
  }
  
  if (fields.length === 0) return;
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE task_types SET ${fields.join(', ')} WHERE id = ?`);
  return stmt.run(...values);
}

// ===== 任務統計相關函數 =====

// 新增或更新任務統計
export function updateTaskStatistics(stats: Omit<TaskStatistics, 'id' | 'created_at'>) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO task_statistics (date, task_id, total_executions, successful_executions, failed_executions, avg_duration_ms)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    stats.date,
    stats.task_id,
    stats.total_executions,
    stats.successful_executions,
    stats.failed_executions,
    stats.avg_duration_ms
  );
}

// 獲取任務統計
export function getTaskStatistics(taskId?: number, dateRange?: { start: string; end: string }): TaskStatistics[] {
  let query = 'SELECT * FROM task_statistics';
  const params: any[] = [];
  const conditions: string[] = [];
  
  if (taskId !== undefined) {
    conditions.push('task_id = ?');
    params.push(taskId);
  }
  
  if (dateRange) {
    conditions.push('date BETWEEN ? AND ?');
    params.push(dateRange.start, dateRange.end);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY date DESC';
  
  const stmt = db.prepare(query);
  return stmt.all(...params) as TaskStatistics[];
}

// 初始化資料庫
initDatabase();