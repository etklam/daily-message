'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, Save, X, ArrowLeft, TestTube, Play, Pause, 
  Settings, Info, HelpCircle, Calendar, Activity,
  CheckCircle, XCircle, Copy, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

// 介面定義
interface ScheduledTask {
  id: number;
  name: string;
  description?: string;
  cron_expression: string;
  timezone: string;
  task_type: string;
  config?: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
  last_execution_time?: string;
  next_execution_time?: string;
  execution_count?: number;
  failure_count?: number;
  max_retries?: number;
  timeout_seconds?: number;
  priority?: number;
  tags?: string;
}

interface TaskType {
  id: string;
  name: string;
  description?: string;
  config_schema?: string;
  default_config?: string;
  handler_class: string;
  is_enabled: boolean;
}

interface TaskFormData {
  name: string;
  description: string;
  cron_expression: string;
  timezone: string;
  task_type: string;
  config: string;
  is_enabled: boolean;
  max_retries: number;
  timeout_seconds: number;
  priority: number;
  tags: string;
}

// 預設的 Cron 表達式選項
const CRON_PRESETS = [
  { label: '每分鐘', value: '* * * * *', description: '每分鐘執行一次' },
  { label: '每5分鐘', value: '*/5 * * * *', description: '每5分鐘執行一次' },
  { label: '每小時', value: '0 * * * *', description: '每小時的第0分鐘執行' },
  { label: '每日上午9點', value: '0 9 * * *', description: '每天上午9點執行' },
  { label: '每日下午6點', value: '0 18 * * *', description: '每天下午6點執行' },
  { label: '每週一上午9點', value: '0 9 * * 1', description: '每週一上午9點執行' },
  { label: '每月1號上午9點', value: '0 9 1 * *', description: '每月1號上午9點執行' }
];

// 任務類型配置範本
const TASK_CONFIG_TEMPLATES = {
  daily_message: {
    prompt: '請提供今日的一句話',
    aiModel: 'gpt-3.5-turbo',
    messageTemplate: '{ai_response}'
  },
  weather_report: {
    locations: ['台北', '台中', '高雄'],
    includeForcast: true,
    temperatureUnit: 'celsius'
  }
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const isNewTask = taskId === 'new';
  
  // 狀態管理
  const [task, setTask] = useState<ScheduledTask | null>(null);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showConfigHelper, setShowConfigHelper] = useState(false);

  // 表單狀態
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    cron_expression: '0 9 * * *',
    timezone: 'Asia/Taipei',
    task_type: 'daily_message',
    config: JSON.stringify(TASK_CONFIG_TEMPLATES.daily_message, null, 2),
    is_enabled: true,
    max_retries: 3,
    timeout_seconds: 300,
    priority: 0,
    tags: ''
  });

  // 初始化載入
  useEffect(() => {
    fetchTaskTypes();
    if (!isNewTask) {
      fetchTask();
    } else {
      setLoading(false);
    }
  }, [taskId, isNewTask]);

  // 資料獲取函數
  const fetchTask = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (data.success) {
        const foundTask = data.data.tasks?.find((t: ScheduledTask) => t.id === parseInt(taskId));
        if (foundTask) {
          setTask(foundTask);
          setFormData({
            name: foundTask.name,
            description: foundTask.description || '',
            cron_expression: foundTask.cron_expression,
            timezone: foundTask.timezone,
            task_type: foundTask.task_type,
            config: foundTask.config || '{}',
            is_enabled: foundTask.is_enabled,
            max_retries: foundTask.max_retries || 3,
            timeout_seconds: foundTask.timeout_seconds || 300,
            priority: foundTask.priority || 0,
            tags: foundTask.tags || ''
          });
        } else {
          alert('找不到指定的任務');
          router.push('/manage-schedule');
        }
      }
    } catch (error) {
      console.error('載入任務失敗:', error);
      alert('載入任務失敗');
      router.push('/manage-schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskTypes = async () => {
    try {
      setTaskTypes([
        {
          id: 'daily_message',
          name: '每日訊息',
          description: '使用 AI 生成每日訊息並發送到 Telegram',
          handler_class: 'DailyMessageTask',
          is_enabled: true
        },
        {
          id: 'weather_report',
          name: '天氣報告',
          description: '獲取天氣資訊並發送報告',
          handler_class: 'WeatherReportTask',
          is_enabled: true
        }
      ]);
    } catch (error) {
      console.error('載入任務類型失敗:', error);
    }
  };

  // 任務操作函數
  const handleSave = async () => {
    setSaving(true);
    try {
      const url = isNewTask ? '/api/tasks' : '/api/tasks';
      const method = isNewTask ? 'POST' : 'PUT';
      
      const requestBody = isNewTask ? {
        ...formData,
        config: formData.config ? JSON.parse(formData.config) : {}
      } : {
        id: parseInt(taskId),
        ...formData,
        config: formData.config ? JSON.parse(formData.config) : {}
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      if (data.success) {
        alert(isNewTask ? '任務建立成功！' : '任務更新成功！');
        router.push('/manage-schedule');
      } else {
        alert((isNewTask ? '建立任務失敗: ' : '更新任務失敗: ') + data.error);
      }
    } catch (error) {
      console.error('儲存任務失敗:', error);
      alert('儲存任務失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (isNewTask) {
      alert('請先儲存任務後再進行測試');
      return;
    }
    
    setTesting(true);
    try {
      const response = await fetch('/api/tasks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: parseInt(taskId) })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('測試執行成功！請檢查日誌查看結果。');
      } else {
        alert('測試執行失敗: ' + data.error);
      }
    } catch (error) {
      console.error('測試執行失敗:', error);
      alert('測試執行失敗');
    } finally {
      setTesting(false);
    }
  };

  // 表單處理函數
  const handleTaskTypeChange = (taskType: string) => {
    setFormData({
      ...formData,
      task_type: taskType,
      config: JSON.stringify(TASK_CONFIG_TEMPLATES[taskType as keyof typeof TASK_CONFIG_TEMPLATES] || {}, null, 2)
    });
  };

  const handleCronPresetSelect = (cronValue: string) => {
    setFormData({
      ...formData,
      cron_expression: cronValue
    });
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(formData.config);
    alert('配置已複製到剪貼簿');
  };

  // 工具函數
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '無';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  const getTaskTypeInfo = (taskType: string) => {
    return taskTypes.find(type => type.id === taskType);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-600">載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題區 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/manage-schedule"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Calendar className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                {isNewTask ? '新增任務' : `編輯任務: ${task?.name}`}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isNewTask && (
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center space-x-2 disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4" />
                  <span>{testing ? '測試中...' : '測試執行'}</span>
                </button>
              )}
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '儲存中...' : '儲存'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：表單內容 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 基本資訊 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <Info className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">基本資訊</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任務名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="輸入任務名稱"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任務類型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => handleTaskTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {taskTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  {getTaskTypeInfo(formData.task_type)?.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {getTaskTypeInfo(formData.task_type)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任務描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="輸入任務描述"
                  />
                </div>
              </div>
            </div>

            {/* 排程設定 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">排程設定</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    執行頻率 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      onChange={(e) => e.target.value && handleCronPresetSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue=""
                    >
                      <option value="">選擇預設頻率...</option>
                      {CRON_PRESETS.map(preset => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label} - {preset.description}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formData.cron_expression}
                      onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="或輸入自訂 Cron 表達式"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      格式: 分 時 日 月 週 (例如: 0 9 * * * 表示每天上午9點)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    時區 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Asia/Taipei">Asia/Taipei (台北時間)</option>
                    <option value="UTC">UTC (世界標準時間)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (東京時間)</option>
                    <option value="America/New_York">America/New_York (紐約時間)</option>
                    <option value="Europe/London">Europe/London (倫敦時間)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 任務配置 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">任務配置</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowConfigHelper(!showConfigHelper)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="顯示配置說明"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={copyConfig}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="複製配置"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {showConfigHelper && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">配置說明</h4>
                  <div className="text-sm text-blue-800">
                    {formData.task_type === 'daily_message' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>prompt:</strong> AI 生成訊息的提示詞</li>
                        <li><strong>aiModel:</strong> 使用的 AI 模型 (gpt-3.5-turbo, gpt-4)</li>
                        <li><strong>messageTemplate:</strong> 訊息範本，使用 {'{ai_response}'} 插入 AI 回應</li>
                      </ul>
                    )}
                    {formData.task_type === 'weather_report' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>locations:</strong> 要查詢天氣的地點陣列</li>
                        <li><strong>includeForcast:</strong> 是否包含天氣預報</li>
                        <li><strong>temperatureUnit:</strong> 溫度單位 (celsius, fahrenheit)</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  配置 JSON
                </label>
                <textarea
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="輸入 JSON 格式的配置"
                />
                <p className="text-xs text-gray-500 mt-1">
                  請輸入有效的 JSON 格式配置
                </p>
              </div>
            </div>

            {/* 進階設定 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">進階設定</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大重試次數
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.max_retries}
                    onChange={(e) => setFormData({ ...formData, max_retries: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">任務失敗時的重試次數</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    超時時間 (秒)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="3600"
                    value={formData.timeout_seconds}
                    onChange={(e) => setFormData({ ...formData, timeout_seconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">任務執行的最大時間</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優先級
                  </label>
                  <input
                    type="number"
                    min="-10"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">數字越大優先級越高</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    標籤
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="用逗號分隔多個標籤"
                  />
                  <p className="text-xs text-gray-500 mt-1">用於分類和搜尋任務</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_enabled"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="mr-2 rounded"
                  />
                  <label htmlFor="is_enabled" className="text-sm font-medium text-gray-700">
                    啟用任務
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：任務資訊 */}
          <div className="space-y-6">
            {!isNewTask && task && (
              <>
                {/* 任務狀態 */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">任務狀態</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">狀態</span>
                      <div className="flex items-center space-x-2">
                        {task.is_enabled ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {task.is_enabled ? '啟用中' : '已停用'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">執行次數</span>
                      <span className="text-sm font-medium">{task.execution_count || 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">失敗次數</span>
                      <span className="text-sm font-medium">{task.failure_count || 0}</span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">下次執行</span>
                          <p className="text-sm font-medium">{formatDateTime(task.next_execution_time)}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600">上次執行</span>
                          <p className="text-sm font-medium">{formatDateTime(task.last_execution_time)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 任務歷史 */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">建立資訊</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">建立時間:</span>
                      <p className="font-medium">{formatDateTime(task.created_at)}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">更新時間:</span>
                      <p className="font-medium">{formatDateTime(task.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 說明文件 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">使用說明</h3>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 任務名稱和類型為必填欄位</p>
                <p>• Cron 表達式決定任務執行頻率</p>
                <p>• 配置必須為有效的 JSON 格式</p>
                <p>• 測試功能可驗證任務是否正常運作</p>
                <p>• 儲存後任務將根據排程自動執行</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}