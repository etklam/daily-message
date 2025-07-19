const Database = require('better-sqlite3');
const path = require('path');
const { mkdirSync } = require('fs');

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');

// 確保資料目錄存在
try {
  mkdirSync(path.dirname(dbPath), { recursive: true });
} catch (error) {
  // 目錄已存在
}

const db = new Database(dbPath);

console.log('🔄 開始升級資料庫結構...');

try {
  // 檢查現有表結構
  const tableInfo = db.prepare("PRAGMA table_info(scheduled_tasks)").all();
  console.log('📋 現有 scheduled_tasks 表結構:', tableInfo.map(col => col.name));

  // 檢查是否需要添加新欄位
  const existingColumns = tableInfo.map(col => col.name);
  const requiredColumns = [
    'last_execution_time',
    'next_execution_time', 
    'execution_count',
    'failure_count',
    'max_retries',
    'timeout_seconds',
    'priority',
    'tags'
  ];

  const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
  
  if (missingColumns.length > 0) {
    console.log('🔧 需要添加的欄位:', missingColumns);
    
    // 添加缺失的欄位
    for (const column of missingColumns) {
      let columnDef;
      switch (column) {
        case 'last_execution_time':
        case 'next_execution_time':
          columnDef = `${column} DATETIME`;
          break;
        case 'execution_count':
        case 'failure_count':
          columnDef = `${column} INTEGER DEFAULT 0`;
          break;
        case 'max_retries':
          columnDef = `${column} INTEGER DEFAULT 3`;
          break;
        case 'timeout_seconds':
          columnDef = `${column} INTEGER DEFAULT 300`;
          break;
        case 'priority':
          columnDef = `${column} INTEGER DEFAULT 0`;
          break;
        case 'tags':
          columnDef = `${column} TEXT`;
          break;
        default:
          columnDef = `${column} TEXT`;
      }
      
      try {
        db.exec(`ALTER TABLE scheduled_tasks ADD COLUMN ${columnDef}`);
        console.log(`✅ 已添加欄位: ${column}`);
      } catch (error) {
        console.log(`⚠️ 添加欄位 ${column} 時出錯 (可能已存在):`, error.message);
      }
    }
  } else {
    console.log('✅ 所有必需欄位都已存在');
  }

  // 確保其他表存在
  console.log('🔧 確保其他必需表存在...');

  // 任務執行記錄表
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

  // 任務類型表
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

  // 任務統計表
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

  // 建立索引
  console.log('🔧 建立索引...');
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled ON scheduled_tasks(is_enabled);
      CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_execution ON scheduled_tasks(next_execution_time);
      CREATE INDEX IF NOT EXISTS idx_task_executions_task_id ON task_executions(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_executions_status ON task_executions(status);
      CREATE INDEX IF NOT EXISTS idx_task_executions_started_at ON task_executions(started_at);
      CREATE INDEX IF NOT EXISTS idx_task_logs_task_type ON task_logs(task_type);
      CREATE INDEX IF NOT EXISTS idx_task_statistics_date ON task_statistics(date);
    `);
    console.log('✅ 索引建立完成');
  } catch (error) {
    console.log('⚠️ 建立索引時出錯:', error.message);
  }

  // 插入預設任務類型
  console.log('🔧 插入預設任務類型...');
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

  console.log('✅ 資料庫升級完成！');

  // 驗證升級結果
  const updatedTableInfo = db.prepare("PRAGMA table_info(scheduled_tasks)").all();
  console.log('📋 升級後的 scheduled_tasks 表結構:', updatedTableInfo.map(col => col.name));

  const taskCount = db.prepare('SELECT COUNT(*) as count FROM scheduled_tasks').get();
  console.log('📊 現有任務數量:', taskCount.count);

  const taskTypeCount = db.prepare('SELECT COUNT(*) as count FROM task_types').get();
  console.log('📊 現有任務類型數量:', taskTypeCount.count);

} catch (error) {
  console.error('❌ 資料庫升級失敗:', error);
  process.exit(1);
} finally {
  db.close();
}