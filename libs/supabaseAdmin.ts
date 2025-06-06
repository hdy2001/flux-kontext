/**
 * Supabase管理员功能
 * 用于初始化数据库和管理Supabase连接
 */
import { createClient } from '@supabase/supabase-js';

// 使用环境变量初始化管理员客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '缺少Supabase环境变量，请确保NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_ANON_KEY已设置',
  );
}

// 创建管理员客户端
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// 数据库初始化标志，防止重复初始化
let isInitialized = false;

/**
 * 初始化Supabase数据库
 * 检查并创建必要的表结构
 */
export async function initializeDatabase() {
  // 避免重复初始化
  if (isInitialized) return;

  try {
    console.log('正在初始化Supabase数据库...');

    // 检查api_usage表是否存在
    const { error: checkError } = await supabaseAdmin
      .from('api_usage')
      .select('identifier')
      .limit(1);

    // 如果表不存在，则创建表
    if (checkError && checkError.code === '42P01') {
      // PostgreSQL错误码：表不存在
      console.log('创建api_usage表...');

      // 创建api_usage表
      const { error: createError } = await supabaseAdmin.rpc('create_api_usage_table');

      // 如果RPC不存在，直接使用SQL创建表
      if (createError) {
        console.log('通过SQL创建表...');
        const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS api_usage (
              identifier TEXT PRIMARY KEY,
              call_count INTEGER DEFAULT 0,
              last_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `,
        });

        // 如果exec_sql不存在，我们无法创建表，但程序会继续运行
        // 使用in-memory处理作为备用方案
        if (sqlError) {
          console.warn('无法创建数据库表，将使用内存模式:', sqlError);
        }
      }
    }

    isInitialized = true;
    console.log('Supabase数据库初始化完成');
  } catch (error) {
    console.error('初始化Supabase数据库时出错:', error);
    // 发生错误时，程序继续运行，使用内存模式作为备用
  }
}

// 当模块加载时自动初始化数据库
if (typeof window === 'undefined') {
  // 仅在服务器端执行
  initializeDatabase().catch(console.error);
}
