import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 更新用户的API使用情况
 * POST请求体：
 * {
 *   increment: number // 增加的使用次数，默认为1
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 验证用户是否已登录
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: '未授权', message: '请先登录' }, { status: 401 });
    }

    const userId = session.user.id;
    const requestData = await request.json();
    const increment = requestData.increment || 1;

    // 首先尝试获取用户的使用记录
    const { data: userData, error: fetchError } = await supabase
      .from('user_usage')
      .select('used_count, limit_count')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      // 如果记录不存在，创建一条新记录
      if (fetchError.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_usage')
          .insert({
            user_id: userId,
            used_count: increment,
            limit_count: 20, // 默认限制
          })
          .select('used_count, limit_count')
          .single();

        if (insertError) {
          console.error('创建用户使用记录失败:', insertError);
          return NextResponse.json(
            { error: '服务器错误', message: '更新使用情况失败' },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          used: newData.used_count,
          limit: newData.limit_count,
        });
      } else {
        console.error('获取用户使用记录失败:', fetchError);
        return NextResponse.json(
          { error: '服务器错误', message: '获取使用情况失败' },
          { status: 500 },
        );
      }
    }

    // 更新用户的使用记录
    const newUsedCount = (userData.used_count || 0) + increment;
    const { data: updatedData, error: updateError } = await supabase
      .from('user_usage')
      .update({
        used_count: newUsedCount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('used_count, limit_count')
      .single();

    if (updateError) {
      console.error('更新用户使用记录失败:', updateError);
      return NextResponse.json(
        { error: '服务器错误', message: '更新使用情况失败' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      used: updatedData.used_count,
      limit: updatedData.limit_count,
    });
  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return NextResponse.json({ error: '服务器错误', message: '处理请求失败' }, { status: 500 });
  }
}
