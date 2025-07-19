'use client';

import { useState, useEffect } from 'react';
import { Clock, Send, TestTube2 } from 'lucide-react';

interface ScheduleConfig {
  cron_expression: string;
  timezone: string;
  message_content: string;
  telegram_api_url: string;
  telegram_bot_password: string;
  telegram_channel_id: string;
  telegram_message_template: string;
}

export default function ScheduleSettingsPage() {
  const [config, setConfig] = useState<ScheduleConfig>({
    cron_expression: '0 9 * * *',
    timezone: 'Asia/Taipei',
    message_content: '請給我今日的天氣預報和建議',
    telegram_api_url: '',
    telegram_bot_password: '',
    telegram_channel_id: '',
    telegram_message_template: '{ai_response}'
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // 載入配置
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        setConfig({
          cron_expression: data.data.cron_expression || '0 9 * * *',
          timezone: data.data.timezone || 'Asia/Taipei',
          message_content: data.data.message_content || '請給我今日的天氣預報和建議',
          telegram_api_url: data.data.telegram_api_url || '',
          telegram_bot_password: data.data.telegram_bot_password || '',
          telegram_channel_id: data.data.telegram_channel_id || '',
          telegram_message_template: data.data.telegram_message_template || '{ai_response}'
        });
      }
    } catch (error) {
      console.error('載入配置失敗:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      if (data.success) {
        setSaveMessage('配置已儲存');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      setSaveMessage('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/config/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.telegram_api_url,
          password: config.telegram_bot_password,
          channelId: config.telegram_channel_id,
          message: '測試訊息 - Daily Message Service'
        })
      });
      
      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.success ? '測試成功' : data.error
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: '測試失敗'
      });
    } finally {
      setTesting(false);
    }
  };

  const validateCron = async (cron: string) => {
    try {
      const response = await fetch('/api/config/validate-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cron })
      });
      
      const data = await response.json();
      return data.valid;
    } catch {
      return false;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">定時任務管理</h1>
      
      <div className="space-y-6">
        {/* 基本設定 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            基本設定
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">執行時間 (Cron 表達式)</label>
              <input
                type="text"
                value={config.cron_expression}
                onChange={(e) => setConfig({ ...config, cron_expression: e.target.value })}
                placeholder="0 9 * * *"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-sm text-gray-800 mt-1">
                範例: 0 9 * * * (每日上午 9 點), 0 8,20 * * * (每日上午 8 點和晚上 8 點)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">時區</label>
              <select
                value={config.timezone}
                onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="Asia/Taipei">台北 (UTC+8)</option>
                <option value="Asia/Tokyo">東京 (UTC+9)</option>
                <option value="America/New_York">紐約 (UTC-5)</option>
                <option value="Europe/London">倫敦 (UTC+0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">訊息內容</label>
              <textarea
                value={config.message_content}
                onChange={(e) => setConfig({ ...config, message_content: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="請輸入要發送給 AI 的訊息內容"
              />
            </div>
          </div>
        </div>

        {/* Telegram Bot API 設定 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" />
            Telegram Bot API 設定
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">目標 API URL</label>
              <input
                type="text"
                value={config.telegram_api_url}
                onChange={(e) => setConfig({ ...config, telegram_api_url: e.target.value })}
                placeholder="https://your-bot-api.com/send-message"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Bot 密碼</label>
              <input
                type="password"
                value={config.telegram_bot_password}
                onChange={(e) => setConfig({ ...config, telegram_bot_password: e.target.value })}
                placeholder="輸入您的 Bot 密碼"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">頻道 ID</label>
              <input
                type="text"
                value={config.telegram_channel_id}
                onChange={(e) => setConfig({ ...config, telegram_channel_id: e.target.value })}
                placeholder="例如: 585426653"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">訊息模板</label>
              <textarea
                value={config.telegram_message_template}
                onChange={(e) => setConfig({ ...config, telegram_message_template: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="例如: {ai_response} 或 今日訊息: {ai_response}"
              />
              <p className="text-sm text-gray-800 mt-1">
                使用 {'{ai_response}'} 作為 AI 回應的佔位符
              </p>
            </div>
          </div>
        </div>

        {/* 測試結果 */}
        {testResult && (
          <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {testResult.message}
          </div>
        )}

        {/* 儲存訊息 */}
        {saveMessage && (
          <div className="p-4 rounded-md bg-blue-50 text-blue-800">
            {saveMessage}
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex gap-4">
          <button 
            onClick={handleTest} 
            disabled={testing || !config.telegram_api_url}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 text-gray-900 flex items-center gap-2"
          >
            <TestTube2 className="w-4 h-4" />
            {testing ? '測試中...' : '測試 Telegram'}
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </div>
    </div>
  );
}