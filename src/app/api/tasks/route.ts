import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllScheduledTasks, 
  addScheduledTask, 
  updateScheduledTask, 
  deleteScheduledTask, 
  toggleScheduledTask,
  ScheduledTask 
} from '@/lib/db';
import { 
  startScheduler, 
  stopScheduler, 
  startSingleTask, 
  stopSingleTask, 
  getSchedulerStatus,
  reloadScheduler 
} from '@/lib/scheduler';
import * as cron from 'node-cron';

// GET - 獲取所有排程任務
export async function GET() {
  try {
    const tasks = getAllScheduledTasks();
    const status = getSchedulerStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        tasks,
        scheduler: status
      }
    });
  } catch (error) {
    console.error('獲取排程任務失敗:', error);
    return NextResponse.json({
      success: false,
      error: '獲取排程任務失敗'
    }, { status: 500 });
  }
}

// POST - 新增排程任務
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, cron_expression, timezone, task_type, config, is_enabled } = body;

    // 驗證必要欄位
    if (!name || !cron_expression || !task_type) {
      return NextResponse.json({
        success: false,
        error: '缺少必要欄位: name, cron_expression, task_type'
      }, { status: 400 });
    }

    // 驗證 cron 表達式
    if (!cron.validate(cron_expression)) {
      return NextResponse.json({
        success: false,
        error: '無效的 cron 表達式'
      }, { status: 400 });
    }

    // 新增任務到資料庫
    const result = addScheduledTask({
      name,
      description: description || '',
      cron_expression,
      timezone: timezone || 'Asia/Taipei',
      task_type,
      config: typeof config === 'object' ? JSON.stringify(config) : (config || ''),
      is_enabled: is_enabled !== undefined ? is_enabled : true
    });

    // 如果任務啟用，立即啟動排程
    if (is_enabled !== false) {
      reloadScheduler();
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid
      },
      message: '排程任務已新增'
    });
  } catch (error) {
    console.error('新增排程任務失敗:', error);
    return NextResponse.json({
      success: false,
      error: '新增排程任務失敗'
    }, { status: 500 });
  }
}

// PUT - 更新排程任務
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少任務 ID'
      }, { status: 400 });
    }

    // 如果有 cron 表達式，驗證它
    if (updateData.cron_expression && !cron.validate(updateData.cron_expression)) {
      return NextResponse.json({
        success: false,
        error: '無效的 cron 表達式'
      }, { status: 400 });
    }

    // 如果 config 是物件，轉換成字串
    if (updateData.config && typeof updateData.config === 'object') {
      updateData.config = JSON.stringify(updateData.config);
    }

    // 更新任務
    updateScheduledTask(id, updateData);

    // 重新載入排程器
    reloadScheduler();

    return NextResponse.json({
      success: true,
      message: '排程任務已更新'
    });
  } catch (error) {
    console.error('更新排程任務失敗:', error);
    return NextResponse.json({
      success: false,
      error: '更新排程任務失敗'
    }, { status: 500 });
  }
}

// DELETE - 刪除排程任務
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少任務 ID'
      }, { status: 400 });
    }

    const taskId = parseInt(id);

    // 先停止該任務
    stopSingleTask(taskId);

    // 從資料庫刪除
    deleteScheduledTask(taskId);

    return NextResponse.json({
      success: true,
      message: '排程任務已刪除'
    });
  } catch (error) {
    console.error('刪除排程任務失敗:', error);
    return NextResponse.json({
      success: false,
      error: '刪除排程任務失敗'
    }, { status: 500 });
  }
}