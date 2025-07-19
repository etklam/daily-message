'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, Play, Pause, Settings, Activity, Calendar, CheckCircle, XCircle, 
  AlertCircle, RefreshCw, Plus, Edit, Trash2, Eye, EyeOff, 
  Search, ChevronRight, TestTube
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface SchedulerStatus {
  isRunning: boolean;
  totalTasks: number;
  activeTasks: number;
  nextRun?: string;
  lastRun?: string;
}

export default function ManageSchedulePage() {
  const router = useRouter();
  
  // 狀態管理
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus>({
    isRunning: false,
    totalTasks: 0,
    activeTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // UI 狀態
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState<string>('all');

  // 初始化載入
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchSchedulerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // 資料獲取函數
  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTasks(),
      fetchTaskTypes(),
      fetchSchedulerStatus()
    ]);
    setLoading(false);
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.data.tasks || []);
        setSchedulerStatus(prev => ({
          ...prev,
          ...data.data.scheduler
        }));
      }
    } catch (error) {
      console.error('載入任務失敗:', error);
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

  const fetchSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (data.success) {
        setSchedulerStatus(prev => ({
          ...prev,
          ...data.data.scheduler
        }));
      }
    } catch (error) {
      console.error('載入排程器狀態失敗:', error);
    }
  };

  // 任務操作函數
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('確定要刪除這個任務嗎？')) return;
    
    setActionLoading(`delete-${taskId}`);
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchTasks();
        alert('任務刪除成功！');
      } else {
        alert('刪除任務失敗: ' + data.error);
      }
    } catch (error) {
      console.error('刪除任務失敗:', error);
      alert('刪除任務失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleTask = async (taskId: number, enabled: boolean) => {
    setActionLoading(`toggle-${taskId}`);
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          is_enabled: enabled
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchTasks();
        alert(`任務已${enabled ? '啟用' : '停用'}！`);
      } else {
        alert('切換任務狀態失敗: ' + data.error);
      }
    } catch (error) {
      console.error('切換任務狀態失敗:', error);
      alert('切換任務狀態失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestTask = async (taskId: number) => {
    setActionLoading(`test-${taskId}`);
    try {
      const response = await fetch('/api/tasks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
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
      setActionLoading(null);
    }
  };

  const handleSchedulerControl = async (action: 'start' | 'stop') => {
    setActionLoading('scheduler');
    try {
      const response = await fetch('/api/tasks/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchSchedulerStatus();
        alert(`排程器已${action === 'start' ? '啟動' : '停止'}！`);
      } else {
        alert('排程器控制失敗: ' + data.error);
      }
    } catch (error) {
      console.error('排程器控制失敗:', error);
      alert('排程器控制失敗');
    } finally {
      setActionLoading(null);
    }
  };

  // 過濾和搜尋
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'enabled' && task.is_enabled) ||
      (filterStatus === 'disabled' && !task.is_enabled);
    
    const matchesSearch = !searchTerm || 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedTaskType === 'all' || task.task_type === selectedTaskType;
    
    return matchesStatus && matchesSearch && matchesType;
  });

  // 工具函數
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '無';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  const getTaskStatusIcon = (task: ScheduledTask) => {
    if (!task.is_enabled) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getTaskStatusText = (task: ScheduledTask) => {
    return task.is_enabled ? '啟用中' : '已停用';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">任務管理</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* 排程器狀態 */}
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100" title={schedulerStatus.isRunning ? '排程系統正在運行，任務將自動執行' : '排程系統已停止，任務不會自動執行'}>
                {schedulerStatus.isRunning ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700">排程器運行中</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">排程器已停止</span>
                  </>
                )}
              </div>

              {/* 排程器控制按鈕 */}
              {schedulerStatus.isRunning ? (
                <button
                  onClick={() => handleSchedulerControl('stop')}
                  disabled={actionLoading === 'scheduler'}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Pause className="w-4 h-4" />
                  <span>停止排程器</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSchedulerControl('start')}
                  disabled={actionLoading === 'scheduler'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>啟動排程器</span>
                </button>
              )}

              {/* 新增任務按鈕 */}
              <Link
                href="/manage-schedule/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>新增任務</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 統計卡片區 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總任務數</p>
                <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">啟用任務</p>
                <p className="text-3xl font-bold text-green-600">{tasks.filter(t => t.is_enabled).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">停用任務</p>
                <p className="text-3xl font-bold text-red-600">{tasks.filter(t => !t.is_enabled).length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">排程器狀態</p>
                <p className={`text-lg font-semibold ${schedulerStatus.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                  {schedulerStatus.isRunning ? '運行中' : '已停止'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {schedulerStatus.isRunning ? '任務將自動執行' : '需要啟動才能自動執行'}
                </p>
              </div>
              <Activity className={`w-8 h-8 ${schedulerStatus.isRunning ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>
        </div>

        {/* 排程器說明區 */}
        {!schedulerStatus.isRunning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">排程器未運行</h3>
                <p className="text-sm text-amber-700 mt-1">
                  排程器目前處於停止狀態，即使任務設定為「啟用中」也不會自動執行。請點擊「啟動排程器」按鈕來開始自動執行排程任務。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 搜尋和過濾區 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜尋任務..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'enabled' | 'disabled')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有狀態</option>
                <option value="enabled">僅啟用</option>
                <option value="disabled">僅停用</option>
              </select>
              
              <select
                value={selectedTaskType}
                onChange={(e) => setSelectedTaskType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有類型</option>
                {taskTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 任務列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">沒有找到任務</h3>
              <p className="text-gray-400 mb-6">建立您的第一個排程任務開始使用</p>
              <Link
                href="/manage-schedule/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>新增任務</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTasks.map(task => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {getTaskStatusIcon(task)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{task.name}</h3>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {getTaskTypeInfo(task.task_type)?.name}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.is_enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {getTaskStatusText(task)}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-6 mt-2 text-sm text-gray-500">
                          <span>頻率: {task.cron_expression}</span>
                          <span>下次執行: {formatDateTime(task.next_execution_time)}</span>
                          <span>執行次數: {task.execution_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* 測試按鈕 */}
                      <button
                        onClick={() => handleTestTask(task.id)}
                        disabled={actionLoading === `test-${task.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="測試執行"
                      >
                        <TestTube className="w-4 h-4" />
                      </button>

                      {/* 啟用/停用按鈕 */}
                      <button
                        onClick={() => handleToggleTask(task.id, !task.is_enabled)}
                        disabled={actionLoading === `toggle-${task.id}`}
                        className={`p-2 rounded-lg ${
                          task.is_enabled
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={task.is_enabled ? '停用' : '啟用'}
                      >
                        {task.is_enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      {/* 編輯按鈕 */}
                      <Link
                        href={`/manage-schedule/${task.id}`}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="編輯"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* 刪除按鈕 */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={actionLoading === `delete-${task.id}`}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* 查看詳情按鈕 */}
                      <Link
                        href={`/manage-schedule/${task.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}