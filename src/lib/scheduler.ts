import * as cron from 'node-cron';
import { randomUUID } from 'crypto';
import { getAllConfig } from './config';
import { 
  addLog, 
  getEnabledScheduledTasks, 
  ScheduledTask,
  addTaskExecution,
  updateTaskExecution,
  updateScheduledTask
} from './db';
import { initTaskSystem, getTaskExecutor, TaskContext } from './tasks';

// 儲存所有排程任務
let scheduledTasks: Map<number, cron.ScheduledTask> = new Map();

// 初始化排程器
export function initScheduler() {
  console.log('初始化排程器和任務系統...');
  
  // 初始化任務系統
  initTaskSystem();
  
  console.log('排程器初始化完成');
}

// 啟動所有排程任務
export function startScheduler() {
  stopScheduler(); // 先停止現有的任務
  
  const tasks = getEnabledScheduledTasks();
  console.log(`啟動 ${tasks.length} 個排程任務`);
  
  tasks.forEach(task => {
    if (!task.id) return;
    
    console.log(`啟動任務: ${task.name} (${task.cron_expression}) [${task.timezone}] 類型: ${task.task_type}`);
    
    const cronJob = cron.schedule(task.cron_expression, async () => {
      console.log(`執行排程任務: ${task.name} (ID: ${task.id})`);
      await executeTask(task);
    }, {
      timezone: task.timezone || 'Asia/Taipei'
    });
    
    scheduledTasks.set(task.id, cronJob);
  });
}

// 停止所有排程任務
export function stopScheduler() {
  scheduledTasks.forEach((task, id) => {
    task.stop();
    console.log(`停止任務 ID: ${id}`);
  });
  scheduledTasks.clear();
  console.log('所有排程任務已停止');
}

// 啟動單個排程任務
export function startSingleTask(taskId: number) {
  // 先停止該任務（如果存在）
  stopSingleTask(taskId);
  
  const tasks = getEnabledScheduledTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    console.log(`找不到任務 ID: ${taskId}`);
    return false;
  }
  
  console.log(`啟動單個任務: ${task.name} (${task.cron_expression})`);
  
  const cronJob = cron.schedule(task.cron_expression, async () => {
    console.log(`執行排程任務: ${task.name}`);
    await executeTask(task);
  }, {
    timezone: task.timezone || 'Asia/Taipei'
  });
  
  scheduledTasks.set(taskId, cronJob);
  return true;
}

// 停止單個排程任務
export function stopSingleTask(taskId: number) {
  const task = scheduledTasks.get(taskId);
  if (task) {
    task.stop();
    scheduledTasks.delete(taskId);
    console.log(`停止任務 ID: ${taskId}`);
    return true;
  }
  return false;
}

// 執行任務 - 重構為使用任務處理器系統
async function executeTask(task: ScheduledTask) {
  if (!task.id) return;
  
  const executionId = randomUUID();
  const startTime = new Date();
  
  // 創建任務執行記錄
  const executionRecord = {
    task_id: task.id,
    execution_id: executionId,
    status: 'running' as const,
    started_at: startTime.toISOString()
  };
  
  try {
    // 記錄執行開始
    const execResult = addTaskExecution(executionRecord);
    const executionDbId = execResult.lastInsertRowid as number;
    
    // 記錄任務開始日誌
    addLog(`task_${task.id}`, 'info', `開始執行任務: ${task.name} (執行ID: ${executionId})`);
    
    // 獲取任務處理器
    const taskHandler = getTaskExecutor(task.task_type);
    
    // 解析任務配置
    let taskConfig: any = {};
    try {
      if (task.config) {
        taskConfig = JSON.parse(task.config);
      }
    } catch (e) {
      console.warn(`解析任務 ${task.id} 配置失敗，使用預設配置:`, e);
      taskConfig = taskHandler.getDefaultConfig();
    }
    
    // 創建任務上下文
    const context: TaskContext = {
      taskId: task.id,
      executionId,
      config: taskConfig,
      retryCount: 0,
      startTime
    };
    
    // 執行前鉤子
    await taskHandler.onBeforeExecute(context);
    
    // 執行任務
    const result = await taskHandler.execute(context);
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    // 更新執行記錄
    updateTaskExecution(executionDbId, {
      status: result.success ? 'completed' : 'failed',
      completed_at: endTime.toISOString(),
      duration_ms: duration,
      result_data: result.data ? JSON.stringify(result.data) : undefined,
      error_message: result.error || undefined
    });
    
    // 更新任務統計
    updateScheduledTask(task.id, {
      last_execution_time: endTime.toISOString(),
      execution_count: (task.execution_count || 0) + 1,
      failure_count: result.success 
        ? task.failure_count || 0 
        : (task.failure_count || 0) + 1
    });
    
    // 執行後鉤子
    await taskHandler.onAfterExecute(result, context);
    
    // 記錄執行結果
    const logLevel = result.success ? 'success' : 'error';
    const logMessage = result.success 
      ? `任務執行成功: ${result.message || '完成'}` 
      : `任務執行失敗: ${result.error || '未知錯誤'}`;
    
    addLog(`task_${task.id}`, logLevel, logMessage);
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    
    console.error(`執行任務 ${task.name} 時發生錯誤:`, error);
    
    // 更新執行記錄為錯誤狀態
    try {
      const execResult = addTaskExecution(executionRecord);
      const executionDbId = execResult.lastInsertRowid as number;
      
      updateTaskExecution(executionDbId, {
        status: 'failed',
        completed_at: endTime.toISOString(),
        duration_ms: duration,
        error_message: errorMessage
      });
    } catch (dbError) {
      console.error('更新執行記錄失敗:', dbError);
    }
    
    // 更新任務失敗計數
    updateScheduledTask(task.id, {
      last_execution_time: endTime.toISOString(),
      execution_count: (task.execution_count || 0) + 1,
      failure_count: (task.failure_count || 0) + 1
    });
    
    // 記錄錯誤日誌
    addLog(`task_${task.id}`, 'error', `任務執行異常: ${errorMessage}`);
    
    // 調用錯誤鉤子
    try {
      const taskHandler = getTaskExecutor(task.task_type);
      const context: TaskContext = {
        taskId: task.id,
        executionId,
        config: {},
        retryCount: 0,
        startTime
      };
      await taskHandler.onError(error as Error, context);
    } catch (hookError) {
      console.error('執行錯誤鉤子失敗:', hookError);
    }
  }
}

// 立即執行任務（用於測試）
export async function executeTaskNow(taskId?: number) {
  if (taskId) {
    // 執行指定任務
    const tasks = getEnabledScheduledTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      console.log(`立即執行任務: ${task.name}`);
      await executeTask(task);
    } else {
      console.log(`找不到任務 ID: ${taskId}`);
    }
  } else {
    // 執行所有啟用的任務
    const tasks = getEnabledScheduledTasks();
    console.log(`立即執行 ${tasks.length} 個任務`);
    for (const task of tasks) {
      await executeTask(task);
    }
  }
}

// 獲取當前排程狀態
export function getSchedulerStatus() {
  const runningTasks = Array.from(scheduledTasks.keys());
  const enabledTasks = getEnabledScheduledTasks();
  
  return {
    isRunning: scheduledTasks.size > 0,
    runningTaskCount: scheduledTasks.size,
    runningTaskIds: runningTasks,
    totalEnabledTasks: enabledTasks.length,
    schedulerActive: scheduledTasks.size > 0
  };
}

// 重新載入排程任務
export function reloadScheduler() {
  console.log('重新載入排程任務...');
  startScheduler();
}

// 獲取任務的下次執行時間
export function getNextExecutionTime(taskId: number): Date | null {
  const task = scheduledTasks.get(taskId);
  if (!task) return null;
  
  // node-cron 沒有直接的方法獲取下次執行時間
  // 這裡返回 null，實際應用中可以使用其他 cron 庫
  return null;
}

// 初始化排程器（在模組載入時執行）
initScheduler();