import { NextRequest, NextResponse } from 'next/server';
import { telegramClient } from '@/lib/telegram';

// POST /api/config/telegram/test - 測試Telegram API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiUrl, password, channelId } = body;

    // 臨時更新配置進行測試
    if (apiUrl) telegramClient['apiUrl'] = apiUrl;
    if (password) telegramClient['password'] = password;
    if (channelId) telegramClient['channelId'] = channelId;

    const result = await telegramClient.testConnection();
    
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}