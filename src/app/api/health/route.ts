import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/health - 健康檢查端點
export async function GET() {
  try {
    // 檢查資料庫連線
    const result = db.prepare('SELECT 1 as test').get();
    
    if (result) {
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
      });
    } else {
      throw new Error('Database check failed');
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}