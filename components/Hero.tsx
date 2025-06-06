'use client';

import Image from "next/image";
import Link from 'next/link';
import ButtonSignin from "./ButtonSignin";
import config from "@/config";

/**
 * Hero组件 - 首页英雄区域
 * 展示产品介绍和主要功能特点
 */
const Hero = () => {
  /**
   * 处理平滑滚动到图像生成器区域
   */
  const handleScrollToGenerator = () => {
    document.querySelector('#image-generator')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col items-center justify-center gap-8 lg:gap-12 px-8 py-16 lg:py-20">
      <div className="flex flex-col gap-6 lg:gap-8 items-center justify-center text-center">
        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight">
          Flux Kontext AI 图像生成
        </h1>
        <h2 className="text-xl lg:text-2xl font-medium text-gray-700 max-w-3xl">
          利用先进的神经网络技术，通过简单的文本描述创建令人惊叹的图像。支持智能文本到图像转换、风格变换和精细编辑。
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button
            className="btn btn-primary btn-lg text-white"
            onClick={handleScrollToGenerator}
          >
            立即体验
          </button>
          <ButtonSignin text="免费注册" extraStyle="btn-outline btn-lg" />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="badge badge-accent p-3">免费使用</div>
          <div className="badge badge-ghost p-3">无需信用卡</div>
          <div className="badge badge-ghost p-3">高质量输出</div>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-8">
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
          <Image
            src="https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=450&fit=crop&crop=center"
            alt="Flux Kontext AI图像示例"
            className="object-cover"
            fill
            priority
            onError={(e) => {
              console.error('Hero图片加载失败');
              // 设置默认背景
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="text-sm font-medium mb-1 opacity-90">AI生成的图像示例</div>
            <div className="text-xs opacity-75">
              提示词: "在夕阳下的海滩上行走的女孩，周围有海鸟飞翔，写实风格"
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-8">
        <h3 className="text-2xl font-bold text-center">主要特点</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">文本到图像转换</h3>
              <p>通过简单的文字描述创建精美图像</p>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">参考图像上传</h3>
              <p>上传参考图片引导AI生成风格一致的结果</p>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">多种纵横比</h3>
              <p>选择适合您需求的图像尺寸和比例</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
