const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:3000/api/scheduled-tasks';

async function testScheduledTasksAPI() {
  console.log('🧪 開始測試排程任務 CRUD API...\n');

  try {
    // 測試 GET - 獲取所有任務
    console.log('1. 測試 GET /api/scheduled-tasks');
    const getResponse = await fetch(API_BASE);
    const getTasks = await getResponse.json();
    console.log('✅ GET 請求成功');
    console.log('📋 現有任務數量:', getTasks.total);
    console.log('📋 任務列表:', JSON.stringify(getTasks.data, null, 2));
    console.log('');

    // 測試 POST - 創建新任務
    console.log('2. 測試 POST /api/scheduled-tasks');
    const newTask = {
      name: '測試任務',
      description: '這是一個測試任務',
      cron_expression: '0 10 * * *',
      timezone: 'Asia/Taipei',
      task_type: 'daily_message',
      config: {
        prompt: '請提供一個測試訊息',
        aiModel: 'gpt-3.5-turbo'
      },
      is_enabled: true,
      max_retries: 3,
      timeout_seconds: 300,
      priority: 0,
      tags: ['test', 'api']
    };

    const postResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTask)
    });

    const postResult = await postResponse.json();
    console.log('✅ POST 請求成功');
    console.log('📝 創建的任務:', JSON.stringify(postResult, null, 2));
    
    const createdTaskId = postResult.data?.id;
    console.log('🆔 新任務 ID:', createdTaskId);
    console.log('');

    if (createdTaskId) {
      // 測試 PUT - 更新任務
      console.log('3. 測試 PUT /api/scheduled-tasks');
      const updateData = {
        id: createdTaskId,
        name: '更新後的測試任務',
        description: '這是一個更新後的測試任務',
        is_enabled: false
      };

      const putResponse = await fetch(API_BASE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const putResult = await putResponse.json();
      console.log('✅ PUT 請求成功');
      console.log('📝 更新結果:', JSON.stringify(putResult, null, 2));
      console.log('');

      // 測試 GET - 驗證更新
      console.log('4. 測試 GET /api/scheduled-tasks (驗證更新)');
      const getUpdatedResponse = await fetch(API_BASE);
      const getUpdatedTasks = await getUpdatedResponse.json();
      const updatedTask = getUpdatedTasks.data.find(task => task.id === createdTaskId);
      console.log('✅ 驗證更新成功');
      console.log('📝 更新後的任務:', JSON.stringify(updatedTask, null, 2));
      console.log('');

      // 測試 DELETE - 刪除任務
      console.log('5. 測試 DELETE /api/scheduled-tasks');
      const deleteResponse = await fetch(`${API_BASE}?id=${createdTaskId}`, {
        method: 'DELETE'
      });

      const deleteResult = await deleteResponse.json();
      console.log('✅ DELETE 請求成功');
      console.log('📝 刪除結果:', JSON.stringify(deleteResult, null, 2));
      console.log('');

      // 測試 GET - 驗證刪除
      console.log('6. 測試 GET /api/scheduled-tasks (驗證刪除)');
      const getFinalResponse = await fetch(API_BASE);
      const getFinalTasks = await getFinalResponse.json();
      const deletedTask = getFinalTasks.data.find(task => task.id === createdTaskId);
      console.log('✅ 驗證刪除成功');
      console.log('📋 任務是否已刪除:', deletedTask ? '❌ 未刪除' : '✅ 已刪除');
      console.log('📋 最終任務數量:', getFinalTasks.total);
      console.log('');
    }

    // 測試篩選功能
    console.log('7. 測試篩選功能');
    
    // 測試按啟用狀態篩選
    const enabledResponse = await fetch(`${API_BASE}?enabled=true`);
    const enabledTasks = await enabledResponse.json();
    console.log('✅ 啟用任務篩選成功');
    console.log('📋 啟用的任務數量:', enabledTasks.total);
    
    // 測試按任務類型篩選
    const typeResponse = await fetch(`${API_BASE}?type=daily_message`);
    const typeTasks = await typeResponse.json();
    console.log('✅ 任務類型篩選成功');
    console.log('📋 daily_message 類型任務數量:', typeTasks.total);
    console.log('');

    console.log('🎉 所有 API 測試完成！');

  } catch (error) {
    console.error('❌ API 測試失敗:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 請確保開發伺服器正在運行：npm run dev');
    }
  }
}

// 執行測試
testScheduledTasksAPI();