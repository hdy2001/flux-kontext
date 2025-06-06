'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* 顶部导航栏 */}
      <nav className="bg-base-100 shadow-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">
              Flux Kontext
            </Link>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">使用指南</h1>
          <Link href="/dashboard" className="btn btn-outline btn-sm">
            返回仪表板
          </Link>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-6">如何使用 Flux Kontext 生成图像</h2>

            <div className="space-y-12">
              {/* 步骤 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="col-span-1">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto md:mx-0">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xl font-semibold mb-2">上传参考图片</h3>
                  <p className="text-base-content/70">
                    点击上传区域或将图片拖放到上传区域。参考图片是必需的，Flux Kontext
                    将基于您的参考图片生成新的图像。 建议使用清晰、高质量的图片以获得最佳效果。
                  </p>
                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <p className="font-medium">提示：</p>
                    <p className="text-sm">
                      图片应清晰可见，避免使用模糊或低质量的图片。支持 JPG、PNG 和 WebP 格式。
                    </p>
                  </div>
                </div>
              </div>

              {/* 步骤 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="col-span-1">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto md:mx-0">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xl font-semibold mb-2">输入详细的提示词</h3>
                  <p className="text-base-content/70">
                    在提示词输入框中，详细描述您想要生成的图像。提示词越详细，生成的图像就越符合您的期望。
                    您可以描述场景、风格、颜色、光照等细节。
                  </p>
                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <p className="font-medium">提示词示例：</p>
                    <p className="text-sm italic">
                      "一只可爱的柴犬坐在绿色草地上，阳光明媚，背景是蓝天白云，照片风格，高清晰度"
                    </p>
                  </div>
                </div>
              </div>

              {/* 步骤 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="col-span-1">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto md:mx-0">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xl font-semibold mb-2">调整生成参数</h3>
                  <p className="text-base-content/70">
                    根据需要调整生成参数，如生成数量和生成强度。生成强度决定了 AI
                    对原始参考图像的改变程度。
                    较低的值会保留更多原始图像的特征，较高的值则会产生更大的变化。
                  </p>
                </div>
              </div>

              {/* 步骤 4 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="col-span-1">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto md:mx-0">
                    <span className="text-2xl font-bold text-primary">4</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xl font-semibold mb-2">点击生成并等待结果</h3>
                  <p className="text-base-content/70">
                    点击"生成图像"按钮后，系统将开始处理您的请求。生成过程可能需要几秒钟到几十秒不等，
                    取决于服务器负载和图像复杂度。生成完成后，您可以下载、分享或进一步编辑生成的图像。
                  </p>
                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <p className="font-medium">注意：</p>
                    <p className="text-sm">
                      每个账户有每日生成限额，您可以在仪表板查看剩余的生成次数。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="divider my-8"></div>

            <h2 className="text-2xl font-bold mb-6">常见问题</h2>

            <div className="space-y-6">
              <div className="collapse collapse-arrow bg-base-200">
                <input type="checkbox" />
                <div className="collapse-title font-medium">为什么必须上传参考图片？</div>
                <div className="collapse-content">
                  <p>
                    Flux Kontext 使用的是 AI
                    图像编辑技术，需要一个基础图像作为参考，然后根据您的提示词对图像进行修改和增强。没有参考图片，AI
                    将无法进行图像生成。
                  </p>
                </div>
              </div>

              <div className="collapse collapse-arrow bg-base-200">
                <input type="checkbox" />
                <div className="collapse-title font-medium">生成的图像有版权限制吗？</div>
                <div className="collapse-content">
                  <p>
                    您使用 Flux Kontext
                    生成的图像归您所有，您可以将其用于个人或商业用途。但请注意，如果您上传的参考图片有版权限制，那么生成的图像也可能受到相应的版权限制。
                  </p>
                </div>
              </div>

              <div className="collapse collapse-arrow bg-base-200">
                <input type="checkbox" />
                <div className="collapse-title font-medium">如何获得更多的生成次数？</div>
                <div className="collapse-content">
                  <p>
                    目前我们为每个用户提供固定的免费生成次数。如果您需要更多的生成次数，请联系我们的客服团队了解升级账户的选项。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link href="/" className="btn btn-primary">
                开始创建
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
