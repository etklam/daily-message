import { NextRequest, NextResponse } from 'next/server';
import { 
  startScheduler, 
  stopScheduler, 
  startSingleTask, 
  stopSingleTask, 
  executeTaskNow,
  getSchedulerStatus,
  reloadScheduler 
} from '@/lib/scheduler';
import { toggleScheduledTask } from '@/lib/db';

// POST - 控制排程任務
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskId } = body;

    switch (action) {
      case 'start_all':
        startScheduler();
        return NextResponse.json({
          success: true,
          message: '所有排程任務已啟動'
        });

      case 'stop_all':
        stopScheduler();
        return NextResponse.json({
          success: true,
          message: '所有排程任務已停止'
        });

      case 'start_task':
        if (!taskId) {
          return NextResponse.json({
            success: false,
            error: '缺少任務 ID'
          }, { status: 400 });
        }
        const startResult = startSingleTask(taskId);
        return NextResponse.json({
          success: startResult,
          message: startResult ? '任務已啟動' : '啟動任務失敗'
        });

      case 'stop_task':
        if (!taskId) {
          return NextResponse.json({
            success: false,
            error: '缺少任務 ID'
          }, { status: 400 });
        }
        const stopResult = stopSingleTask(taskId);
        return NextResponse.json({
          success: stopResult,
          message: stopResult ? '任務已停止' : '停止任務失敗'
        });

      case 'toggle_task':
        if (!taskId) {
          return NextResponse.json({
            success: false,
            error: '缺少任務 ID'
          }, { status: 400 });
        }
        const { enabled } = body;
        if (enabled === undefined) {
          return NextResponse.json({
            success: false,
            error: '缺少 enabled 參數'
          }, { status: 400 });
        }
        
        // 更新資料庫中的狀態
        toggleScheduledTask(taskId, enabled);
        
        // 根據狀態啟動或停止任務
        if (enabled) {
          startSingleTask(taskId);
        } else {
          stopSingleTask(taskId);
        }
        
        return NextResponse.json({
          success: true,
          message: enabled ? '任務已啟用' : '任務已停用'
        });

      case 'execute_now':
        if (taskId) {
          await executeTaskNow(taskId);
          return NextResponse.json({
            success: true,
            message: '任務已立即執行'
          });
        } else {
          await executeTaskNow();
          return NextResponse.json({
            success: true,
            message: '所有任務已立即執行'
          });
        }

      case 'reload':
        reloadScheduler();
        return NextResponse.json({
          success: true,
          message: '排程器已重新載入'
        });

      case 'status':
        const status = getSchedulerStatus();
        return NextResponse.json({
          success: true,
          data: status
        });

      default:
        return NextResponse.json({
          success: false,
          error: '未知的操作'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('控制排程任務失敗:', error);
    return NextResponse.json({
      success: false,
      error: '控制排程任務失敗'
    }, { status: 500 });
  }
}