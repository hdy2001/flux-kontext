/**
 * API调用限制管理
 * 跟踪和限制每个用户的API调用次数
 */
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin, initializeDatabase } from './supabaseAdmin';

// 未登录用户的API调用限制 - 使用会话cookie识别用户
const MAX_FREE_CALLS = 20;
// 登录用户的API调用限制
const MAX_LOGGED_IN_CALLS = 100;
// API调用计数重置周期（毫秒） - 每24小时
const RESET_PERIOD = 24 * 60 * 60 * 1000;

// 内存缓存，作为数据库不可用时的备用方案
const memoryCache: Map<string, { count: number; lastReset: Date }> = new Map();

/**
 * 创建Supabase客户端
 * @returns Supabase客户端
 */
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('缺少Supabase环境变量');
  }

  return createClient(supabaseUrl, supabaseKey);
};

/**
 * 获取未登录用户的会话ID
 * 如果不存在，则创建一个新的
 * @returns 会话ID
 */
const getSessionId = () => {
  const cookieStore = cookies();
  let sessionId = cookieStore.get('flux_session_id')?.value;

  if (!sessionId) {
    // 使用更安全的方法生成唯一ID
    sessionId = generateSecureId();
    // 设置cookie 7天过期
    cookieStore.set('flux_session_id', sessionId, {
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
  }

  return sessionId;
};

/**
 * 生成安全的随机ID
 * 使用更安全的随机数生成方法，降低碰撞风险
 * @returns 安全的随机ID
 */
const generateSecureId = (): string => {
  // 生成8个随机字节并转换为十六进制字符串
  const randomBytes = new Uint8Array(16);

  // 在服务器端可以使用crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // 备用方案：使用随机数填充
    for (let i = 0; i < randomBytes.length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // 转换为十六进制字符串并添加时间戳
  const timestamp = Date.now().toString(36);
  const randomHex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${timestamp}-${randomHex}`;
};

/**
 * 检查内存缓存中的API使用情况
 * 当数据库不可用时使用
 * @param identifier 用户标识符
 * @param maxCalls 最大调用次数
 * @returns API使用情况
 */
function checkMemoryCacheLimit(identifier: string, maxCalls: number) {
  let cacheEntry = memoryCache.get(identifier);

  // 如果缓存条目不存在或需要重置
  if (!cacheEntry || Date.now() - cacheEntry.lastReset.getTime() > RESET_PERIOD) {
    cacheEntry = { count: 0, lastReset: new Date() };
    memoryCache.set(identifier, cacheEntry);
  }

  const remainingCalls = Math.max(0, maxCalls - cacheEntry.count);

  return {
    canCall: remainingCalls > 0,
    remainingCalls,
    used: cacheEntry.count,
    limit: maxCalls,
    isUnlimited: false,
    error:
      remainingCalls > 0 ? undefined : '已达到API调用限制。请登录以获得更多使用次数或稍后再试。',
  };
}

/**
 * 更新内存缓存中的调用计数
 * @param identifier 用户标识符
 * @param maxCalls 最大调用次数
 * @returns 剩余调用次数
 */
function updateMemoryCacheLimit(identifier: string, maxCalls: number) {
  let cacheEntry = memoryCache.get(identifier);

  // 如果缓存条目不存在或需要重置
  if (!cacheEntry || Date.now() - cacheEntry.lastReset.getTime() > RESET_PERIOD) {
    cacheEntry = { count: 1, lastReset: new Date() };
  } else {
    cacheEntry.count += 1;
  }

  memoryCache.set(identifier, cacheEntry);
  return Math.max(0, maxCalls - cacheEntry.count);
}

/**
 * 确保数据库已初始化
 */
async function ensureDatabaseInitialized() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.warn('数据库初始化失败，将使用内存模式:', error);
  }
}

/**
 * 检查用户是否可以调用API
 * @param userId 用户ID，如果未登录则为undefined
 * @returns 包含是否允许调用和剩余调用次数的对象
 */
export async function checkApiLimit(userId?: string) {
  // 确保数据库已初始化
  await ensureDatabaseInitialized();

  try {
    const supabase = createSupabaseClient();

    // 对于登录用户，使用用户ID作为标识
    // 对于未登录用户，使用会话ID作为标识
    const identifier = userId || getSessionId();
    const maxCalls = userId ? MAX_LOGGED_IN_CALLS : MAX_FREE_CALLS;

    let usageRecord;

    // 查询用户的API使用记录
    const { data, error } = await supabase
      .from('api_usage')
      .select('call_count, last_reset')
      .eq('identifier', identifier)
      .single();

    // 如果发生错误（不是"没有找到记录"的错误）
    if (error && error.code !== 'PGRST116') {
      console.warn('查询API使用记录失败，使用内存缓存:', error);
      return checkMemoryCacheLimit(identifier, maxCalls);
    }

    usageRecord = data;

    // 如果没有记录或需要重置计数
    if (
      !usageRecord ||
      (usageRecord.last_reset &&
        Date.now() - new Date(usageRecord.last_reset).getTime() > RESET_PERIOD)
    ) {
      // 创建或重置记录
      const { error: upsertError } = await supabase.from('api_usage').upsert({
        identifier,
        call_count: 0,
        last_reset: new Date().toISOString(),
      });

      if (upsertError) {
        console.warn('创建API使用记录失败，使用内存缓存:', upsertError);
        return checkMemoryCacheLimit(identifier, maxCalls);
      }

      return {
        canCall: true,
        remainingCalls: maxCalls,
        used: 0,
        limit: maxCalls,
        isUnlimited: false,
      };
    }

    // 检查是否达到限制
    const currentCount = usageRecord.call_count || 0;
    const remainingCalls = Math.max(0, maxCalls - currentCount);

    return {
      canCall: remainingCalls > 0,
      remainingCalls,
      used: currentCount,
      limit: maxCalls,
      isUnlimited: false,
      error:
        remainingCalls > 0 ? undefined : '已达到API调用限制。请登录以获得更多使用次数或稍后再试。',
    };
  } catch (error) {
    console.error('检查API限制时出错，使用内存缓存:', error);
    const identifier = userId || getSessionId();
    const maxCalls = userId ? MAX_LOGGED_IN_CALLS : MAX_FREE_CALLS;
    return checkMemoryCacheLimit(identifier, maxCalls);
  }
}

/**
 * 更新用户的API调用计数
 * @param userId 用户ID，如果未登录则为undefined
 * @returns 剩余调用次数
 */
export async function updateApiLimit(userId?: string) {
  // 确保数据库已初始化
  await ensureDatabaseInitialized();

  try {
    const supabase = createSupabaseClient();

    // 对于登录用户，使用用户ID作为标识
    // 对于未登录用户，使用会话ID作为标识
    const identifier = userId || getSessionId();
    const maxCalls = userId ? MAX_LOGGED_IN_CALLS : MAX_FREE_CALLS;

    // 我们不再尝试使用RPC函数，直接使用基本的查询和更新操作
    let currentCount;

    try {
      // 获取当前计数
      const { data: record, error: selectError } = await supabase
        .from('api_usage')
        .select('call_count, last_reset')
        .eq('identifier', identifier)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      // 如果记录不存在或需要重置
      if (
        !record ||
        (record.last_reset && Date.now() - new Date(record.last_reset).getTime() > RESET_PERIOD)
      ) {
        // 创建或重置记录
        const { error: upsertError } = await supabase.from('api_usage').upsert({
          identifier,
          call_count: 1, // 从1开始，因为这是第一次调用
          last_reset: new Date().toISOString(),
        });

        if (upsertError) {
          throw upsertError;
        }

        currentCount = 1;
      } else {
        // 更新现有记录
        const newCount = (record.call_count || 0) + 1;
        const { error: updateError } = await supabase
          .from('api_usage')
          .update({ call_count: newCount })
          .eq('identifier', identifier);

        if (updateError) {
          throw updateError;
        }

        currentCount = newCount;
      }
    } catch (dbError) {
      console.warn('数据库操作失败，使用内存缓存:', dbError);
      return updateMemoryCacheLimit(identifier, maxCalls);
    }

    // 计算剩余调用次数
    return Math.max(0, maxCalls - currentCount);
  } catch (error) {
    console.error('更新API调用计数时出错，使用内存缓存:', error);
    const identifier = userId || getSessionId();
    const maxCalls = userId ? MAX_LOGGED_IN_CALLS : MAX_FREE_CALLS;
    return updateMemoryCacheLimit(identifier, maxCalls);
  }
}

/**
 * 获取用户的API使用情况
 * @param userId 用户ID，如果未登录则为undefined
 * @returns API使用情况
 */
export async function getApiUsage(userId?: string) {
  // 确保数据库已初始化
  await ensureDatabaseInitialized();

  try {
    const supabase = createSupabaseClient();

    // 对于登录用户，使用用户ID作为标识
    // 对于未登录用户，使用会话ID作为标识
    const identifier = userId || getSessionId();
    const maxCalls = userId ? MAX_LOGGED_IN_CALLS : MAX_FREE_CALLS;

    // 查询用户的API使用记录
    const { data, error } = await supabase
      .from('api_usage')
      .select('call_count, last_reset')
      .eq('identifier', identifier)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('查询API使用记录失败，使用内存缓存:', error);
      const cacheResult = checkMemoryCacheLimit(identifier, maxCalls);
      return {
        used: cacheResult.used,
        limit: cacheResult.limit,
        isUnlimited: cacheResult.isUnlimited,
        remainingCalls: cacheResult.remainingCalls,
      };
    }

    const usageRecord = data;

    // 如果没有记录
    if (!usageRecord) {
      return {
        used: 0,
        limit: maxCalls,
        isUnlimited: false,
        remainingCalls: maxCalls,
      };
    }

    // 检查是否需要重置计数
    if (
      usageRecord.last_reset &&
      Date.now() - new Date(usageRecord.last_reset).getTime() > RESET_PERIOD
    ) {
      // 重置记录
      const { error: upsertError } = await supabase.from('api_usage').upsert({
        identifier,
        call_count: 0,
        last_reset: new Date().toISOString(),
      });

      if (upsertError) {
        console.warn('重置API使用记录失败，使用当前值:', upsertError);
      } else {
        return {
          used: 0,
          limit: maxCalls,
          isUnlimited: false,
          remainingCalls: maxCalls,
        };
      }
    }

    // 计算剩余调用次数
    const currentCount = usageRecord.call_count || 0;
    const remainingCalls = Math.max(0, maxCalls - currentCount);

    return {
      used: currentCount,
      limit: maxCalls,
      isUnlimited: false,
      remainingCalls,
    };
  } catch (error) {
    console.error('获取API使用情况时出错，使用内存缓存:', error);
    const identifier = userId || getSessionId();
    const maxCalls = userId ? MAX_LOGGED_IN_CALLS : MAX_FREE_CALLS;
    const cacheResult = checkMemoryCacheLimit(identifier, maxCalls);
    return {
      used: cacheResult.used,
      limit: cacheResult.limit,
      isUnlimited: cacheResult.isUnlimited,
      remainingCalls: cacheResult.remainingCalls,
    };
  }
}
