import { NextRequest, NextResponse } from 'next/server';
import cron from 'node-cron';

// POST /api/config/validate-cron - 驗證cron表達式
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cronExpression } = body;

    if (!cronExpression) {
      return NextResponse.json(
        { success: false, error: '請提供 Cron 表達式' },
        { status: 400 }
      );
    }

    const isValid = cron.validate(cronExpression);
    
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Cron 表達式有效',
        description: getCronDescription(cronExpression)
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '無效的 Cron 表達式'
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 簡單的 Cron 表達式描述
function getCronDescription(expression: string): string {
  const parts = expression.split(' ');
  if (parts.length !== 5) return '標準 Cron 表達式';
  
  const [minute, hour, day, month, weekday] = parts;
  
  let desc = '';
  if (minute !== '*' && hour !== '*') {
    desc += `每天 ${hour}:${minute.padStart(2, '0')} 執行`;
  } else if (hour !== '*') {
    desc += `每天 ${hour}:00 執行`;
  } else {
    desc = '每小時執行';
  }
  
  return desc;
}