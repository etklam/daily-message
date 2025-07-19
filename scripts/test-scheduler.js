// 測試多任務排程器腳本
const path = require('path');
const fs = require('fs');

// 確保使用正確的路徑
const projectRoot = path.join(__dirname, '..');

console.log('🧪 測試多任務排程器...');

async function testScheduler() {
  try {
    // 使用 TypeScript 編譯器來執行
    require('ts-node/register');
    
    // 引入模組
    const { 
      getAllScheduledTasks,
      addScheduledTask,
      getEnabledScheduledTasks 
    } = require('../src/lib/db');
    
    const {
      startScheduler,
      stopScheduler,
      getSchedulerStatus,
      executeTaskNow
    } = require('../src/lib/scheduler');

    console.log('\n📋 測試 1: 檢查預設任務');
    const allTasks = getAllScheduledTasks();
    console.log(`✅ 找到 ${allTasks.length} 個任務:`);
    allTasks.forEach(task => {
      console.log(`   - ${task.name}: ${task.cron_expression} (${task.is_enabled ? '啟用' : '停用'})`);
    });

    console.log('\n📋 測試 2: 新增測試任務');
    const testTask = {
      name: '測試任務',
      description: '每分鐘執行的測試任務',
      cron_expression: '*/1 * * * *', // 每分鐘執行
      timezone: 'Asia/Taipei',
      task_type: 'daily_message',
      config: JSON.stringify({
        daily_message: '這是測試訊息'
      }),
      is_enabled: true
    };
    
    const result = addScheduledTask(testTask);
    console.log(`✅ 測試任務已新增，ID: ${result.lastInsertRowid}`);

    console.log('\n📋 測試 3: 檢查啟用的任務');
    const enabledTasks = getEnabledScheduledTasks();
    console.log(`✅ 找到 ${enabledTasks.length} 個啟用的任務`);

    console.log('\n📋 測試 4: 啟動排程器');
    startScheduler();
    const status = getSchedulerStatus();
    console.log(`✅ 排程器狀態:`);
    console.log(`   - 運行中: ${status.isRunning}`);
    console.log(`   - 活躍任務數: ${status.runningTaskCount}`);
    console.log(`   - 任務 IDs: [${status.runningTaskIds.join(', ')}]`);

    console.log('\n📋 測試 5: 立即執行任務測試');
    console.log('⏳ 執行預設任務...');
    await executeTaskNow(1); // 執行第一個任務
    console.log('✅ 任務執行完成');

    console.log('\n📋 測試 6: 停止排程器');
    setTimeout(() => {
      stopScheduler();
      const finalStatus = getSchedulerStatus();
      console.log(`✅ 排程器已停止:`);
      console.log(`   - 運行中: ${finalStatus.isRunning}`);
      console.log(`   - 活躍任務數: ${finalStatus.runningTaskCount}`);
      
      console.log('\n🎉 所有測試完成！');
      process.exit(0);
    }, 2000); // 2秒後停止

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 執行測試
testScheduler();