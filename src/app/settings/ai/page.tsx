'use client';

import { useState, useEffect } from 'react';

interface AIConfig {
  openai_api_url: string;
  openai_api_key: string;
  openai_model: string;
  openai_timeout: string;
  openai_retries: string;
}

export default function AISettingsPage() {
  const [config, setConfig] = useState<AIConfig>({
    openai_api_url: '',
    openai_api_key: '',
    openai_model: '',
    openai_timeout: '30000',
    openai_retries: '3'
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
          openai_api_url: data.data.openai_api_url || 'https://api.openai.com/v1/chat/completions',
          openai_api_key: data.data.openai_api_key || '',
          openai_model: data.data.openai_model || '',
          openai_timeout: data.data.openai_timeout || '30000',
          openai_retries: data.data.openai_retries || '3'
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
      const response = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.openai_api_url,
          apiKey: config.openai_api_key,
          model: config.openai_model
        })
      });
      
      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.success ? '連線成功' : data.error
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

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">AI 設定</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">OpenAI 配置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">API 端點</label>
            <input
              type="text"
              value={config.openai_api_url}
              onChange={(e) => setConfig({ ...config, openai_api_url: e.target.value })}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">API 金鑰</label>
            <input
              type="password"
              value={config.openai_api_key}
              onChange={(e) => setConfig({ ...config, openai_api_key: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">模型選擇</label>
            <input
              type="text"
              value={config.openai_model}
              onChange={(e) => setConfig({ ...config, openai_model: e.target.value })}
              placeholder="請輸入模型名稱"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">超時時間 (毫秒)</label>
              <input
                type="number"
                value={config.openai_timeout}
                onChange={(e) => setConfig({ ...config, openai_timeout: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">重試次數</label>
              <input
                type="number"
                value={config.openai_retries}
                onChange={(e) => setConfig({ ...config, openai_retries: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>

          {testResult && (
            <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testResult.message}
            </div>
          )}

          {saveMessage && (
            <div className="p-4 rounded-md bg-blue-50 text-blue-800">
              {saveMessage}
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={handleTest} 
              disabled={testing || !config.openai_api_key}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 text-gray-900"
            >
              {testing ? '測試中...' : '測試連線'}
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
    </div>
  );
}