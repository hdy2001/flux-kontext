'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ButtonAccount from '@/components/ButtonAccount';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usageStats, setUsageStats] = useState({
    used: 0,
    limit: 20,
    percentage: 0,
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        setIsLoading(true);
        // 获取用户信息
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        // 获取API使用情况
        const response = await fetch('/api/flux/usage');
        if (response.ok) {
          const data = await response.json();
          const used = data.used || 0;
          const limit = data.limit || 20;
          setUsageStats({
            used,
            limit,
            percentage: Math.min(Math.round((used / limit) * 100), 100),
          });
        }
      } catch (error) {
        console.error('加载用户数据失败:', error);
        toast.error('加载用户数据失败');
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* 顶部导航栏 */}
      <nav className="bg-base-100 shadow-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">Flux Kontext</h1>
          </div>
          <div className="flex items-center gap-4">
            <ButtonAccount />
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 欢迎卡片 */}
            <div className="col-span-1 lg:col-span-2">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-2xl">
                    欢迎回来, {user?.user_metadata?.full_name || user?.email || '用户'}!
                  </h2>
                  <p className="text-base-content/70 mt-2">
                    使用 Flux Kontext 强大的 AI 图像生成功能，创建令人惊叹的视觉内容。
                  </p>
                  <div className="card-actions justify-end mt-4">
                    <Link href="/" className="btn btn-primary">
                      开始创建
                    </Link>
                  </div>
                </div>
              </div>

              {/* 最近生成的图片 */}
              <div className="card bg-base-100 shadow-xl mt-8">
                <div className="card-body">
                  <h2 className="card-title text-xl">最近生成的图片</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="aspect-square bg-base-200 rounded-lg flex items-center justify-center">
                      <p className="text-base-content/50">暂无生成记录</p>
                    </div>
                    <div className="aspect-square bg-base-200 rounded-lg flex items-center justify-center">
                      <p className="text-base-content/50">暂无生成记录</p>
                    </div>
                  </div>
                  <div className="card-actions justify-center mt-6">
                    <Link href="/history" className="btn btn-outline btn-sm">
                      查看所有历史
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 侧边栏 */}
            <div className="col-span-1">
              {/* 使用统计 */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-xl">API 使用情况</h2>
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span>
                        已使用 {usageStats.used} / {usageStats.limit}
                      </span>
                      <span className="text-primary">{usageStats.percentage}%</span>
                    </div>
                    <progress
                      className={`progress w-full ${
                        usageStats.percentage > 80 ? 'progress-error' : 'progress-primary'
                      }`}
                      value={usageStats.percentage}
                      max="100"
                    ></progress>
                  </div>
                  {usageStats.percentage > 80 && (
                    <div className="alert alert-warning mt-4 py-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>您的使用配额即将用完</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 快速指南 */}
              <div className="card bg-base-100 shadow-xl mt-8">
                <div className="card-body">
                  <h2 className="card-title text-xl">快速指南</h2>
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-start">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <span className="text-primary">1</span>
                      </div>
                      <p>上传参考图片（必需）</p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <span className="text-primary">2</span>
                      </div>
                      <p>输入详细的提示词</p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <span className="text-primary">3</span>
                      </div>
                      <p>点击生成并等待结果</p>
                    </li>
                  </ul>
                  <div className="card-actions justify-center mt-6">
                    <Link href="/guide" className="btn btn-ghost btn-sm">
                      查看完整教程
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
