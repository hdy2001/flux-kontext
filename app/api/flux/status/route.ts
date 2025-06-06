/**
 * Flux图像生成状态检查API路由
 * 查询图像生成请求的状态
 */
import { NextResponse } from 'next/server';
import { getImageGenerationStatus } from '@/libs/fluxApi';
import { initializeDatabase } from '@/libs/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * 处理GET请求 - 检查图像生成状态
 */
export async function GET(req: Request) {
  try {
    // 确保数据库已初始化
    await initializeDatabase();

    // 获取请求ID
    const url = new URL(req.url);
    const requestId = url.searchParams.get('requestId');

    // 验证请求ID
    if (!requestId) {
      return NextResponse.json({ error: '缺少请求ID参数' }, { status: 400 });
    }

    // 验证requestId格式 - 应该是一个有效的UUID或其他有效格式
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(requestId) && !/^[a-zA-Z0-9_-]{10,}$/.test(requestId)) {
      return NextResponse.json({ error: '无效的请求ID格式' }, { status: 400 });
    }

    // 调用API客户端查询状态
    const statusResponse = await getImageGenerationStatus(requestId);

    // 如果状态检查失败，返回错误
    if (statusResponse.status === 'failed' && statusResponse.error) {
      return NextResponse.json(
        {
          status: 'failed',
          error: statusResponse.error,
          requestId,
        },
        { status: statusResponse.error.includes('超时') ? 408 : 500 },
      );
    }

    // 返回状态响应
    return NextResponse.json(statusResponse);
  } catch (error) {
    console.error('Flux状态检查失败:', error);
    const errorMessage = error instanceof Error ? error.message : '状态检查失败';
    return NextResponse.json(
      {
        error: errorMessage,
        status: 'failed',
      },
      { status: 500 },
    );
  }
}
