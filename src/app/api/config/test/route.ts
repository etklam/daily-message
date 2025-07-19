import { NextRequest, NextResponse } from 'next/server';
import { openaiClient } from '@/lib/openai';

// POST /api/config/test - 測試AI連線
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiUrl, apiKey, model } = body;

    const result = await openaiClient.testConnection(apiUrl, apiKey, model);
    
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}