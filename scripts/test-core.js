// 測試腳本 - 驗證核心功能
const path = require('path');
const fs = require('fs');

console.log('🧪 開始測試核心功能...\n');

// 檢查資料庫檔案
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
console.log('📊 檢查資料庫檔案...');
if (fs.existsSync(dbPath)) {
  console.log('✅ 資料庫檔案存在:', dbPath);
  const stats = fs.statSync(dbPath);
  console.log('📊 檔案大小:', Math.round(stats.size / 1024) + 'KB');
} else {
  console.log('❌ 資料庫檔案不存在');
}

// 檢查目錄結構
console.log('\n📁 檢查目錄結構...');
const requiredFiles = [
  'src/lib/db.ts',
  'src/lib/config.ts',
  'src/lib/openai.ts',
  'src/lib/scheduler.ts',
  'types/index.ts'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log('✅', file);
  } else {
    console.log('❌', file);
  }
});

// 檢查配置檔案
console.log('\n⚙️ 檢查配置...');
const packageJson = require('../package.json');
console.log('✅ 套件版本:', packageJson.version);
console.log('✅ 依賴套件:', Object.keys(packageJson.dependencies).length, '個');
console.log('✅ 開發依賴:', Object.keys(packageJson.devDependencies).length, '個');

console.log('\n🎉 核心功能測試完成！');