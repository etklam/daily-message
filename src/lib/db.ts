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
}

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

// 初始化資料庫
initDatabase();