import { Suspense } from 'react'
import Header from "@/components/Header";
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import FluxImageGenerator from '@/components/FluxImageGenerator';
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `FLUX KONTEXT - 由Flux.1提供支持的智能图像生成平台`,
  description:
    'FLUX KONTEXT: 先进的AI图像合成平台，提供上下文敏感的编辑功能。通过复杂的文本到图像转换、风格转换和精细编辑解决方案，增强和重新创建视觉效果。',
  keywords: [
    'FLUX Kontext',
    'AI图像生成器',
    'FLUX AI',
    'AI艺术',
    '文本到图像',
    '图像编辑',
    'AI绘画',
  ],
  canonicalUrlRelative: '/',
});

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <Hero />
        <section id="image-generator" className="py-16 px-4 bg-base-200">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">体验 Flux Kontext 的强大功能</h2>
            <FluxImageGenerator />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
