/**
 * Flux图像生成器组件
 * 提供上传图片、输入提示词、选择纵横比和生成图像的用户界面
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import apiClient from '@/libs/api';
import toast from 'react-hot-toast';

// API响应类型定义
interface ApiResponse {
  status?: string;
  imageUrl?: string;
  error?: string;
  requestId?: string;
  remainingCalls?: number;
  // 用于使用情况接口
  used?: number;
  limit?: number;
  success?: boolean;
  requiresLogin?: boolean; // 从API返回，表示需要登录才能继续使用
}

// 错误映射表，将可能的错误转换为用户友好的消息
const errorMessages = {
  API请求超时: '生成请求超时，请稍后再试',
  状态查询超时: '查询状态超时，请稍后检查结果',
  获取结果超时: '获取生成结果超时，请稍后查看',
  'Failed to submit': '提交生成请求失败，请检查网络连接',
  'Failed to check': '检查状态失败，请稍后再试',
  default: '发生错误，请稍后重试',
};

// 获取用户友好的错误消息
const getUserFriendlyError = (error: string | undefined): string => {
  if (!error) return errorMessages.default;

  // 检查是否匹配任何已知错误
  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.includes(key)) return message;
  }

  // 返回原始错误或默认错误
  return error || errorMessages.default;
};

const FluxImageGenerator = () => {
  // 状态管理
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<{
    used: number;
    limit: number;
    remainingCalls: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载API使用情况
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const result = (await apiClient.get('/flux/usage')) as ApiResponse;
        if (result && typeof result === 'object') {
          const used = result.used || 0;
          const limit = result.limit || 20;
          setUsageStats({
            used,
            limit,
            remainingCalls: Math.max(0, limit - used),
          });
        }
      } catch (error) {
        console.error('Failed to fetch API usage:', error);
        // 不显示错误通知，因为apiClient已经处理了错误显示
      }
    };

    fetchUsage();
  }, []);

  /**
   * 处理图片上传
   * @param e - 文件输入事件
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('请上传有效的图片文件 (JPEG, PNG, WebP, GIF)');
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片文件大小不能超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      setImage(imageDataUrl);
      setPreviewImage(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  /**
   * 点击上传按钮
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * 清除已上传图片
   */
  const handleClearImage = () => {
    setImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 轮询检查生成状态
   * @param requestId - 请求ID
   * @param pollCount - 轮询次数
   */
  const pollGenerationStatus = async (requestId: string, pollCount = 0) => {
    // 设置最大轮询次数 (60次 * 2秒 = 最多等待2分钟)
    const MAX_POLLS = 60;

    // 如果达到最大轮询次数，停止轮询并显示错误
    if (pollCount >= MAX_POLLS) {
      setGenerating(false);
      toast.error('图像生成时间过长，请稍后查看或重新尝试');
      return;
    }

    try {
      const response = (await apiClient.get(`/flux/status?requestId=${requestId}`)) as ApiResponse;

      // 处理API响应
      if (response && typeof response === 'object') {
        if (response.status === 'completed' && response.imageUrl) {
          setResultImage(response.imageUrl);
          setGenerating(false);
          toast.success('图像生成成功！');
          return;
        } else if (response.status === 'failed') {
          setGenerating(false);
          toast.error(`生成失败: ${getUserFriendlyError(response.error)}`);
          return;
        }

        // 更新轮询次数显示进度
        if (pollCount > 0 && pollCount % 5 === 0) {
          // 每5次轮询更新一次提示，避免过多提示
          toast.loading(`图像正在生成中，已等待${pollCount * 2}秒...`, {
            id: 'generation-progress',
          });
        }

        // 继续轮询，增加计数
        setTimeout(() => pollGenerationStatus(requestId, pollCount + 1), 2000);
      } else {
        // 处理意外的响应格式
        setGenerating(false);
        toast.error('无法解析服务器响应');
      }
    } catch (error) {
      console.error('图像生成状态检查失败:', error);
      setGenerating(false);
      // 移除重复的错误提示，因为apiClient已经处理了错误显示
      // 只在特定情况下显示额外的错误信息
      if (error instanceof Error && error.message.includes('422')) {
        toast.error('请求参数验证失败，请检查输入内容', { id: 'validation-error' });
      }
    }
  };

  /**
   * 改进的下载功能 - 支持跨域图片下载
   */
  const handleDownload = async () => {
    if (!resultImage) return;

    try {
      // 显示下载进度
      toast.loading('正在准备下载...', { id: 'download-progress' });

      // 使用fetch获取图片数据，避免跨域问题
      const response = await fetch(resultImage);
      if (!response.ok) {
        throw new Error('图片下载失败');
      }

      // 获取图片blob数据
      const blob = await response.blob();

      // 创建本地URL
      const url = window.URL.createObjectURL(blob);

      // 创建下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = `flux-kontext-${Date.now()}.png`;
      link.style.display = 'none';

      // 添加到DOM并触发下载
      document.body.appendChild(link);
      link.click();

      // 清理资源
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('图片下载成功！', { id: 'download-progress' });
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载失败，请右键保存图片', { id: 'download-progress' });

      // 备用方案：在新窗口打开图片
      window.open(resultImage, '_blank');
    }
  };

  /**
   * 改进的图片生成函数 - 增强错误处理
   */
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }

    // 验证提示词长度
    if (prompt.trim().length < 3) {
      toast.error('提示词至少需要3个字符');
      return;
    }

    if (prompt.trim().length > 500) {
      toast.error('提示词不能超过500个字符');
      return;
    }

    // 验证用户是否上传了图片
    if (!image) {
      toast.error('请上传至少一张参考图片');
      return;
    }

    // 检查是否还有剩余调用次数
    if (usageStats && usageStats.remainingCalls <= 0) {
      toast.error('您已达到API调用限制。请登录以获取更多使用次数。');
      if (typeof window !== 'undefined') {
        if (confirm('是否前往登录页面？')) {
          window.location.href = '/signin';
        }
      }
      return;
    }

    setGenerating(true);
    setResultImage(null);

    try {
      // 准备API请求数据
      const requestData = {
        prompt: prompt.trim(),
        // 将单个图片转换为image_urls数组格式
        image_urls: image ? [image] : undefined,
      };

      console.log('发送生成请求:', {
        ...requestData,
        image_urls: image ? ['[图片数据]'] : undefined,
      });

      // 发送生成请求
      const response = (await apiClient.post('/flux/generate', requestData)) as ApiResponse;

      console.log('生成请求响应:', response);

      // 增强的响应处理逻辑
      try {
        // 首先检查响应是否存在
        if (!response) {
          throw new Error('服务器返回空响应');
        }

        // 尝试解析响应数据
        let parsedResponse = response;

        // 如果响应是字符串，尝试解析为JSON
        if (typeof response === 'string') {
          try {
            parsedResponse = JSON.parse(response);
          } catch (parseError) {
            console.error('JSON解析失败:', parseError);
            throw new Error('服务器响应格式错误');
          }
        }

        // 检查是否为有效对象
        if (!parsedResponse || typeof parsedResponse !== 'object') {
          throw new Error('服务器响应不是有效的对象');
        }

        // 更新剩余调用次数
        if (typeof parsedResponse.remainingCalls === 'number') {
          setUsageStats((prev) => ({
            used: prev?.used ? prev.used + 1 : 1,
            limit: prev?.limit || 20,
            remainingCalls: parsedResponse.remainingCalls,
          }));
        }

        // 如果需要登录
        if (parsedResponse.requiresLogin) {
          setGenerating(false);
          toast.error('您已达到免费API调用限制。请登录以获取更多使用次数。');
          if (typeof window !== 'undefined') {
            if (confirm('是否前往登录页面？')) {
              window.location.href = '/signin';
            }
          }
          return;
        }

        // 检查是否有错误
        if (parsedResponse.error) {
          setGenerating(false);
          toast.error(`生成失败: ${parsedResponse.error}`);
          return;
        }

        // 检查requestId
        if (parsedResponse.requestId && typeof parsedResponse.requestId === 'string') {
          toast.success('生成请求已提交，正在处理中...');
          // 开始轮询检查状态
          pollGenerationStatus(parsedResponse.requestId);
        } else {
          setGenerating(false);
          toast.error('生成请求失败：服务器未返回有效的请求ID');
          console.error('无效的requestId:', parsedResponse.requestId);
        }
      } catch (parseError) {
        console.error('响应解析错误:', parseError);
        setGenerating(false);
        toast.error(
          `响应解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`,
        );
      }
    } catch (error) {
      console.error('图像生成请求失败:', error);
      setGenerating(false);

      // 提供更详细的错误信息
      if (error instanceof Error) {
        if (error.message.includes('422')) {
          toast.error('请求参数有误，请检查提示词和图片格式');
        } else if (error.message.includes('401')) {
          toast.error('API认证失败，请联系管理员');
        } else if (error.message.includes('429')) {
          toast.error('请求过于频繁，请稍后再试');
        } else {
          toast.error(`生成失败: ${error.message}`);
        }
      } else {
        toast.error('生成失败，请稍后重试');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-base-100 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Flux Kontext 图像生成器</h2>

      {/* 使用限制提示 */}
      {usageStats && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">API 使用情况</span>
            <span className="text-sm font-medium">
              {usageStats.used} / {usageStats.limit}
            </span>
          </div>
          <div className="w-full bg-base-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                usageStats.remainingCalls <= 5 ? 'bg-error' : 'bg-primary'
              }`}
              style={{ width: `${Math.min((usageStats.used / usageStats.limit) * 100, 100)}%` }}
            ></div>
          </div>
          {usageStats.remainingCalls <= 5 && usageStats.remainingCalls > 0 && (
            <p className="text-sm mt-2 text-warning">
              您的免费使用次数即将用完，请登录以获取更多使用次数。
            </p>
          )}
          {usageStats.remainingCalls <= 0 && (
            <p className="text-sm mt-2 text-error">
              您已用完免费使用次数，请登录以获取更多使用次数。
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左侧：输入区域 */}
        <div className="space-y-6">
          {/* 上传图片 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              参考图片 <span className="text-error">(必须上传)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button onClick={handleUploadClick} className="btn btn-outline" type="button">
                上传图片
              </button>
              {previewImage && (
                <button
                  onClick={handleClearImage}
                  className="btn btn-outline btn-error"
                  type="button"
                >
                  清除图片
                </button>
              )}
            </div>
            {!previewImage && (
              <div className="text-sm text-error mt-2">
                Flux Kontext API 需要至少一张参考图片才能生成图像
              </div>
            )}
            {previewImage && (
              <div className="mt-2 border rounded-lg overflow-hidden">
                <Image
                  src={previewImage}
                  alt="预览图"
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* 提示词输入 */}
          <div className="space-y-2">
            <label htmlFor="prompt" className="block text-sm font-medium">
              提示词 (必填)
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要生成的图像，例如：一只橙色的猫咪坐在草地上，背景是蓝天白云"
              className="textarea textarea-bordered w-full h-32"
              required
            />
            <div className="text-xs text-base-content/60">{prompt.trim().length}/500 字符</div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={
              generating ||
              !prompt.trim() ||
              prompt.trim().length < 3 ||
              prompt.trim().length > 500 ||
              !image ||
              (usageStats && usageStats.remainingCalls <= 0)
            }
            className="btn btn-primary w-full"
            type="button"
          >
            {generating ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                生成中...
              </>
            ) : (
              '生成图像'
            )}
          </button>
        </div>

        {/* 右侧：结果显示 */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full h-80 bg-base-200 rounded-lg flex items-center justify-center overflow-hidden relative">
            {generating ? (
              <div className="text-center">
                <div className="loading loading-spinner loading-lg"></div>
                <p className="mt-4">正在生成图像，请稍候...</p>
                <p className="text-xs mt-2 text-base-content/70">生成过程可能需要10-30秒</p>
              </div>
            ) : resultImage ? (
              <Image
                src={resultImage}
                alt="Generated image"
                fill
                style={{ objectFit: 'contain' }}
                onError={(e) => {
                  console.error('图片加载失败:', resultImage);
                  setResultImage(null);
                  toast.error('图片加载失败，请重新生成');
                }}
                onLoad={() => {
                  console.log('图片加载成功:', resultImage);
                }}
              />
            ) : (
              <div className="text-center text-base-content/50 p-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto mb-4 opacity-40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p>生成的图像将显示在这里</p>
                <p className="text-xs mt-2">输入提示词并点击"生成图像"按钮</p>
              </div>
            )}
          </div>

          {resultImage && (
            <div className="mt-4 space-y-2 w-full">
              <button onClick={handleDownload} className="btn btn-accent w-full" type="button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                下载图像
              </button>
              <button
                onClick={() => window.open(resultImage, '_blank')}
                className="btn btn-outline btn-sm w-full"
                type="button"
              >
                在新窗口查看
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 使用提示 */}
      <div className="mt-8 p-4 bg-base-200 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">使用提示:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>提供详细的提示词可以获得更好的生成结果</li>
          <li>上传参考图片是必需的，AI 将基于您的参考图片生成新图像</li>
          <li>生成过程可能需要10-30秒，请耐心等待</li>
          <li>登录后可以获得更多生成次数</li>
          <li>提示词长度建议在3-500字符之间</li>
        </ul>
      </div>
    </div>
  );
};

export default FluxImageGenerator;
