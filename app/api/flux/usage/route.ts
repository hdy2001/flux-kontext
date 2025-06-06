/**
 * Flux API使用情况API路由
 * 返回用户的API调用统计信息
 */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 处理GET请求 - 获取API使用情况
 */
export async function GET() {
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

    try {
      // 从数据库获取用户的API使用情况
      const { data, error } = await supabase
        .from('user_usage')
        .select('used_count, limit_count')
        .eq('user_id', userId)
        .single();

      if (error) {
        // 如果找不到记录或表不存在，创建一个默认记录
        console.log('获取用户使用情况失败:', error);

        // 尝试创建记录
        try {
          const { data: newData, error: insertError } = await supabase
            .from('user_usage')
            .insert({
              user_id: userId,
              used_count: 0,
              limit_count: 20, // 默认限制
            })
            .select('used_count, limit_count')
            .single();

          if (insertError) {
            console.error('创建用户使用记录失败:', insertError);
            // 如果创建失败，返回默认值
            return NextResponse.json({
              used: 0,
              limit: 20,
            });
          }

          return NextResponse.json({
            used: newData.used_count,
            limit: newData.limit_count,
          });
        } catch (insertErr) {
          console.error('创建用户使用记录时出错:', insertErr);
          // 返回默认值
          return NextResponse.json({
            used: 0,
            limit: 20,
          });
        }
      }

      return NextResponse.json({
        used: data?.used_count || 0,
        limit: data?.limit_count || 20,
      });
    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      // 返回默认值
      return NextResponse.json({
        used: 0,
        limit: 20,
      });
    }
  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return NextResponse.json({ error: '服务器错误', message: '处理请求失败' }, { status: 500 });
  }
}
