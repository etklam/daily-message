// 資料庫初始化腳本
const path = require('path');
const fs = require('fs');

// 確保使用正確的路徑
const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'src', 'lib', 'db.ts');

console.log('🗄️ 初始化資料庫...');

// 建立 data 目錄
const dataDir = path.join(projectRoot, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ 建立 data 目錄');
}

// 使用 TypeScript 編譯器來執行
try {
  require('ts-node/register');
  require('../src/lib/db');
  console.log('✅ 資料庫初始化完成');
} catch (error) {
  console.error('❌ 初始化失敗:', error.message);
  process.exit(1);
}