/**
 * Flux图像生成API路由
 * 处理图像生成请求，使用fluxApi客户端调用Fal.ai的API
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { submitImageGenerationRequest } from '@/libs/fluxApi';

export const dynamic = 'force-dynamic';

/**
 * 处理POST请求 - 提交图像生成
 */
export async function POST(req: NextRequest) {
  try {
    // 获取请求数据
    const body = await req.json();
    const { prompt, image, image_urls } = body;

    // 验证提示词
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: '提示词不能为空' }, { status: 400 });
    }

    // 验证图像URL数组（必需）
    if (
      !image_urls ||
      !Array.isArray(image_urls) ||
      image_urls.length === 0 ||
      image_urls.some((img) => typeof img !== 'string')
    ) {
      return NextResponse.json({ error: '请提供至少一个有效的图像URL' }, { status: 400 });
    }

    // 获取用户ID（如果已登录）
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // 检查API调用限制
    let usageData;
    if (userId) {
      // 获取用户的API使用情况
      const usageResponse = await fetch(`${req.nextUrl.origin}/api/flux/usage`, {
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      });

      if (usageResponse.ok) {
        usageData = await usageResponse.json();
      }
    }

    // 默认值
    const used = usageData?.used || 0;
    const limit = usageData?.limit || 20;
    const remainingCalls = Math.max(0, limit - used);

    // 如果不能调用API
    if (remainingCalls <= 0) {
      // 如果用户未登录且已达到限制，建议登录
      if (!userId) {
        return NextResponse.json(
          {
            error: '您已达到免费API调用限制。请登录以获得更多使用次数。',
            remainingCalls: 0,
            requiresLogin: true,
          },
          { status: 429 },
        );
      }

      // 如果用户已登录但仍达到限制
      return NextResponse.json(
        {
          error: '您的API调用次数已达上限，请稍后再试。',
          remainingCalls: 0,
        },
        { status: 429 },
      );
    }

    // 调用Flux API客户端提交请求
    const response = await submitImageGenerationRequest({
      prompt,
      image, // 兼容旧版本
      images: image_urls, // 新版使用image_urls数组
      userId,
    });

    // 如果请求提交失败，返回错误
    if (response.status === 'failed') {
      return NextResponse.json({ error: response.error || 'Flux API调用失败' }, { status: 500 });
    }

    // 更新API调用计数
    if (userId) {
      await fetch(`${req.nextUrl.origin}/api/flux/usage/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: req.headers.get('cookie') || '',
        },
        body: JSON.stringify({ increment: 1 }),
      });
    }

    // 返回包含requestId和剩余调用次数的响应
    return NextResponse.json({
      requestId: response.requestId,
      status: response.status,
      remainingCalls: Math.max(0, remainingCalls - 1), // 减去本次使用
      // 同时返回图像URL和图像URL数组（如果有）
      imageUrl: response.imageUrl,
      imageUrls: response.imageUrls,
    });
  } catch (error) {
    console.error('Flux API调用失败:', error);
    return NextResponse.json({ error: 'Flux API调用失败' }, { status: 500 });
  }
}
