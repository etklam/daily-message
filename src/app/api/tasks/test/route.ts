import { NextResponse } from 'next/server';
import { TaskRegistry } from '@/lib/tasks/TaskRegistry';
import { TaskContext } from '@/lib/tasks/TaskHandler';
import { db, ScheduledTask } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: '缺少任務 ID'
      }, { status: 400 });
    }

    // 從資料庫獲取任務詳情
    const task = db.prepare('SELECT * FROM scheduled_tasks WHERE id = ?').get(taskId) as ScheduledTask;

    if (!task) {
      return NextResponse.json({
        success: false,
        error: '找不到指定的任務'
      }, { status: 404 });
    }

    // 獲取任務處理器
    const handler = TaskRegistry.getHandler(task.task_type);
    if (!handler) {
      return NextResponse.json({
        success: false,
        error: `找不到任務類型 '${task.task_type}' 的處理器`
      }, { status: 400 });
    }

    // 準備任務執行上下文
    const executionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context: TaskContext = {
      taskId: task.id!,
      executionId,
      config: task.config ? JSON.parse(task.config) : {},
      retryCount: 0,
      startTime: new Date()
    };

    // 執行任務測試
    const startTime = Date.now();
    const result = await handler.execute(context);
    const executionTime = Date.now() - startTime;

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          message: '任務測試執行成功',
          result: result.data,
          executionTime: `${executionTime}ms`,
          taskType: task.task_type,
          taskName: task.name
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || '任務測試執行失敗',
        shouldRetry: result.shouldRetry
      }, { status: 500 });
    }

  } catch (error) {
    console.error('任務測試 API 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '內部伺服器錯誤: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}