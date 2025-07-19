import { db } from './db';

export interface Config {
  openai_api_url: string;
  openai_api_key: string;
  openai_model: string;
  openai_timeout: string;
  openai_retries: string;
  schedule_time: string;
  timezone: string;
  daily_message: string;
  telegram_api_url: string;
  telegram_bot_password: string;
  telegram_channel_id: string;
  telegram_message_template: string;
}

// 獲取所有配置
export function getAllConfig(): Partial<Config> {
  const stmt = db.prepare('SELECT key, value FROM system_config');
  const rows = stmt.all() as Array<{ key: string; value: string }>;
  
  const config: Partial<Config> = {};
  rows.forEach(row => {
    config[row.key as keyof Config] = row.value;
  });
  
  return config;
}

// 獲取單個配置
export function getConfig(key: string): string | undefined {
  const stmt = db.prepare('SELECT value FROM system_config WHERE key = ?');
  const result = stmt.get(key) as { value: string } | undefined;
  return result?.value;
}

// 設定配置
export function setConfig(key: string, value: string): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO system_config (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(key, value);
}

// 批次設定配置
export function setMultipleConfig(config: Partial<Config>): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO system_config (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  
  const insertMany = db.transaction((configs: Array<[string, string]>) => {
    configs.forEach(([key, value]) => stmt.run(key, value));
  });
  
  const configArray = Object.entries(config) as Array<[string, string]>;
  insertMany(configArray);
}