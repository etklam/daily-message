import { NextRequest, NextResponse } from 'next/server';
import { getAllConfig, setMultipleConfig } from '@/lib/config';
import { reloadScheduler } from '@/lib/scheduler';

// GET /api/config - 獲取所有配置
export async function GET() {
  try {
    const config = getAllConfig();
    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '獲取配置失敗'
      },
      { status: 500 }
    );
  }
}

// PUT /api/config - 更新配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 過濾掉無效的鍵
    const validKeys = [
      'openai_api_url',
      'openai_api_key',
      'openai_model',
      'openai_timeout',
      'openai_retries',
      'schedule_time',
      'timezone',
      'daily_message',
      'telegram_api_url',
      'telegram_bot_password',
      'telegram_channel_id',
      'telegram_message_template'
    ];
    
    const filteredConfig = Object.fromEntries(
      Object.entries(body).filter(([key]) => validKeys.includes(key))
    );
    
    setMultipleConfig(filteredConfig);
    
    // 重新載入排程器以應用新配置
    reloadScheduler();
    
    return NextResponse.json({
      success: true,
      message: '配置已更新'
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新配置失敗'
      },
      { status: 500 }
    );
  }
}