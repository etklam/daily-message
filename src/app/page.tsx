import Link from 'next/link';
import { Bot, Clock, Database, Activity, ExternalLink } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      title: 'AI 設定',
      description: '配置 OpenAI API 連線和模型參數',
      icon: Bot,
      href: '/settings/ai',
      color: 'text-blue-500'
    },
    {
      title: '定時任務',
      description: '設定每日訊息發送時間和內容',
      icon: Clock,
      href: '/settings/schedule',
      color: 'text-green-500'
    },
    {
      title: '系統狀態',
      description: '查看系統健康狀態和執行日誌',
      icon: Activity,
      href: '/api/health',
      color: 'text-purple-500'
    },
    {
      title: '資料管理',
      description: '管理配置和查看歷史記錄',
      icon: Database,
      href: '/api/logs',
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Daily Message Service
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            定時向 OpenAI API 發送訊息並轉發到 Telegram Bot 的智慧服務
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          <Link href="/settings/ai">
            <div className="bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-500" />
                開始設定
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                立即開始配置您的 AI 服務
              </p>
            </div>
          </Link>

          <Link href="/settings/schedule">
            <div className="bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                設定排程
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                設定每日訊息發送時間
              </p>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <div className="bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <Icon className={`w-8 h-8 mb-2 ${feature.color}`} />
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-gray-700 mt-1">{feature.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* System Info */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md border">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">系統資訊</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">技術堆疊</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Next.js 15 + TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• SQLite 資料庫</li>
                    <li>• Docker 容器化</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">功能特色</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• 即時配置管理</li>
                    <li>• 自動定時任務</li>
                    <li>• 完整的日誌系統</li>
                    <li>• 健康狀態監控</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="flex justify-center gap-4">
            <a 
              href="/api/health" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Activity className="w-4 h-4 mr-2" />
              API 狀態
            </a>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            使用 MIT 授權開源 • 版本 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
