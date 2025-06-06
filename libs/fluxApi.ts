/**
 * Flux Kontext API集成服务
 * 使用fal.ai官方客户端实现与API的通信
 */
import { fal } from '@fal-ai/client';

// 模型ID
const MODEL_ID = 'fal-ai/flux-pro/kontext/max/multi';

// 配置API密钥（如果环境变量中没有设置）
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY,
  });
} else {
  console.error('警告: 缺少FAL_KEY环境变量，Flux API功能将不可用，请在.env.local文件中设置此变量');
}

// 定义Fal.ai的图像响应类型
interface FalImage {
  url: string;
  [key: string]: any; // 允许其他属性
}

// 请求类型定义
export interface FluxKontextRequest {
  // 支持多种图片输入方式
  images?: string[]; // 多个图片的Base64编码或URL数组
  image?: string; // 单个图片的Base64编码或URL (向后兼容)
  prompt: string;
  userId?: string;
}

// 响应类型定义
export interface FluxKontextResponse {
  requestId: string; // 请求ID，用于查询状态
  status: 'processing' | 'completed' | 'failed'; // 处理状态
  imageUrl?: string; // 生成的图像URL
  imageUrls?: string[]; // 多个生成的图像URL
  error?: string; // 错误信息
}

/**
 * 提交图像生成请求
 * @param params 请求参数
 * @returns 请求结果
 */
export async function submitImageGenerationRequest(
  params: FluxKontextRequest,
): Promise<FluxKontextResponse> {
  try {
    // 准备图片URL数组
    const imageUrls: string[] = [];

    // 处理多图片数组
    if (params.images && params.images.length > 0) {
      for (const img of params.images) {
        // 确保图片格式正确 (data:image/ 或 http/https URL)
        imageUrls.push(
          img.startsWith('data:') || img.startsWith('http') ? img : `data:image/jpeg;base64,${img}`,
        );
      }
    }
    // 向后兼容：处理单个图片
    else if (params.image) {
      // 确保图片格式正确 (data:image/ 或 http/https URL)
      imageUrls.push(
        params.image.startsWith('data:') || params.image.startsWith('http')
          ? params.image
          : `data:image/jpeg;base64,${params.image}`,
      );
    }

    // 如果没有图片，使用默认示例图片
    if (imageUrls.length === 0) {
      imageUrls.push('https://v3.fal.media/files/penguin/XoW0qavfF-ahg-jX4BMyL_image.webp');
      imageUrls.push('https://v3.fal.media/files/tiger/bml6YA7DWJXOigadvxk75_image.webp');
    }

    // 准备API请求参数
    const input = {
      prompt: params.prompt,
      image_urls: imageUrls,
      // 移除 aspect_ratio 参数，因为API不支持
    };

    console.log('提交Flux Kontext请求:', {
      prompt: input.prompt,
      image_urls: `[${imageUrls.length}个图片URL]`,
    });

    // 使用fal.ai客户端提交请求
    const result = await fal.subscribe(MODEL_ID, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log('Flux Kontext响应:', {
      requestId: result.requestId,
      status: 'completed',
      imageUrl: result.data?.images?.[0]?.url || '',
    });

    // 返回标准化的响应
    return {
      requestId: result.requestId,
      status: 'completed', // subscribe 方法会等待完成
      imageUrl: result.data?.images?.[0]?.url || '',
      imageUrls: result.data?.images?.map((img: FalImage) => img.url) || [],
    };
  } catch (error) {
    console.error('Error submitting Flux Kontext request:', error);
    return {
      requestId: '',
      status: 'failed',
      error: `提交Flux Kontext请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

/**
 * 获取生成状态 - 按照官方案例
 * @param requestId 请求ID
 * @returns 生成状态
 */
export async function getImageGenerationStatus(requestId: string): Promise<FluxKontextResponse> {
  try {
    // 按照官方案例格式
    const status = await fal.queue.status(MODEL_ID, {
      requestId: requestId,
      logs: true,
    });

    console.log('获取状态响应:', {
      requestId: status.request_id,
      status: status.status,
    });

    // 使用字符串比较而不是枚举值
    const statusStr = String(status.status).toUpperCase();

    if (statusStr === 'COMPLETED') {
      // 获取结果
      const result = await fal.queue.result(MODEL_ID, {
        requestId: requestId,
      });

      return {
        requestId: result.requestId,
        status: 'completed',
        imageUrl: result.data?.images?.[0]?.url || '',
        imageUrls: result.data?.images?.map((img: FalImage) => img.url) || [],
      };
    } else if (statusStr === 'FAILED') {
      return {
        requestId,
        status: 'failed',
        error: '生成失败',
      };
    } else {
      // 处理其他状态 (IN_PROGRESS, IN_QUEUE)
      return {
        requestId,
        status: 'processing',
      };
    }
  } catch (error) {
    console.error('Error checking status:', error);
    return {
      requestId,
      status: 'failed',
      error: '检查状态失败',
    };
  }
}

/**
 * 根据纵横比获取图像尺寸
 * @param aspectRatio 纵横比字符串，例如 "1:1", "16:9"
 * @returns 图像宽度和高度
 */
function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  // 解析纵横比
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

  // 基础尺寸
  const baseSize = 1024;

  // 计算宽高，保持适当的比例
  if (widthRatio >= heightRatio) {
    return {
      width: baseSize,
      height: Math.round((baseSize * heightRatio) / widthRatio),
    };
  } else {
    return {
      width: Math.round((baseSize * widthRatio) / heightRatio),
      height: baseSize,
    };
  }
}
