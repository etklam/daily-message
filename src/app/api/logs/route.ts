import { NextRequest, NextResponse } from 'next/server';
import { getLogs } from '@/lib/db';

// GET /api/logs - 獲取執行日誌
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const logs = getLogs(limit);
    
    return NextResponse.json({
      success: true,
      data: logs
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '獲取日誌失敗'
      },
      { status: 500 }
    );
  }
}