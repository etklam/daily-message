import { NextRequest, NextResponse } from 'next/server';
import {
  getAllScheduledTasks,
  addScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  ScheduledTask
} from '@/lib/db';
import { validateTaskConfig, getAvailableTaskTypes, initTaskSystem } from '@/lib/tasks';

// 初始化任務系統
try {
  initTaskSystem();
} catch (error) {
  console.error('任務系統初始化失敗:', error);
}

// GET - 獲取所有排程任務
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled');
    const taskType = searchParams.get('type');
    
    let tasks = getAllScheduledTasks();
    
    // 篩選條件
    if (enabled !== null) {
      const isEnabled = enabled === 'true';
      tasks = tasks.filter(task => task.is_enabled === isEnabled);
    }
    
    if (taskType) {
      tasks = tasks.filter(task => task.task_type === taskType);
    }
    
    // 添加任務類型資訊
    const availableTypes = getAvailableTaskTypes();
    const tasksWithTypeInfo = tasks.map(task => {
      const typeInfo = availableTypes.find(type => type.id === task.task_type);
      return {
        ...task,
        typeInfo: typeInfo ? {
          name: typeInfo.name,
          description: typeInfo.description
        } : null
      };
    });
    
    return NextResponse.json({
      success: true,
      data: tasksWithTypeInfo,
      total: tasksWithTypeInfo.length
    });
  } catch (error) {
    console.error('獲取排程任務失敗:', error);
    return NextResponse.json({
      success: false,
      error: '獲取排程任務失敗'
    }, { status: 500 });
  }
}

// POST - 創建新的排程任務
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      cron_expression,
      timezone = 'Asia/Taipei',
      task_type,
      config,
      is_enabled = true,
      max_retries = 3,
      timeout_seconds = 300,
      priority = 0,
      tags
    } = body;
    
    // 驗證必填欄位
    if (!name || !cron_expression || !task_type) {
      return NextResponse.json({
        success: false,
        error: '缺少必填欄位: name, cron_expression, task_type'
      }, { status: 400 });
    }
    
    // 驗證任務類型和配置
    const configValidation = validateTaskConfig(task_type, config || {});
    if (!configValidation.valid) {
      return NextResponse.json({
        success: false,
        error: '任務配置驗證失敗',
        details: configValidation.errors
      }, { status: 400 });
    }
    
    // 創建任務
    const newTask: Omit<ScheduledTask, 'id' | 'created_at' | 'updated_at'> = {
      name,
      description,
      cron_expression,
      timezone,
      task_type,
      config: config ? JSON.stringify(config) : undefined,
      is_enabled,
      max_retries,
      timeout_seconds,
      priority,
      tags: tags ? JSON.stringify(tags) : undefined
    };
    
    const result = addScheduledTask(newTask);
    
    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        ...newTask
      },
      message: '排程任務創建成功'
    }, { status: 201 });
    
  } catch (error) {
    console.error('創建排程任務失敗:', error);
    return NextResponse.json({
      success: false,
      error: '創建排程任務失敗'
    }, { status: 500 });
  }
}

// PUT - 更新排程任務
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    // 驗證必填欄位
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少必填欄位: id'
      }, { status: 400 });
    }

    // 驗證任務類型和配置
    if (updateData.task_type && updateData.config) {
      const configValidation = validateTaskConfig(updateData.task_type, updateData.config);
      if (!configValidation.valid) {
        return NextResponse.json({
          success: false,
          error: '任務配置驗證失敗',
          details: configValidation.errors
        }, { status: 400 });
      }
    }

    // 處理 JSON 欄位
    if (updateData.config && typeof updateData.config === 'object') {
      updateData.config = JSON.stringify(updateData.config);
    }
    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    // 更新任務
    updateScheduledTask(id, updateData);
    
    return NextResponse.json({
      success: true,
      message: '排程任務更新成功'
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 驗證必填欄位
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少必填欄位: id'
      }, { status: 400 });
    }

    // 刪除任務
    deleteScheduledTask(parseInt(id));
    
    return NextResponse.json({
      success: true,
      message: '排程任務刪除成功'
    });
    
  } catch (error) {
    console.error('刪除排程任務失敗:', error);
    return NextResponse.json({
      success: false,
      error: '刪除排程任務失敗'
    }, { status: 500 });
  }
}