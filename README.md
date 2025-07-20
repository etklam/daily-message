# Daily Message Service

一個功能完整的定時任務管理系統，支援多種任務類型、靈活的排程設定，並整合 OpenAI API 與 Telegram Bot 服務。

## 功能特色

- 🤖 **OpenAI整合** - 支援自定義API端點和模型選擇
- ⏰ **進階排程** - 使用cron表達式設定執行時間，支援多時區
- 🎛️ **任務管理系統** - 完整的任務CRUD操作，支援任務啟用/停用
- 📊 **即時監控** - 任務執行狀態、統計資訊即時更新
- 📝 **SQLite儲存** - 所有配置、任務和日誌使用SQLite管理
- 🐳 **Docker支援** - 完整的容器化部署方案
- 🔍 **即時測試** - 內建API連線測試功能
- 📱 **Telegram整合** - 專為Telegram Bot API優化的配置介面
- 🎯 **任務類型擴展** - 模組化架構，易於新增任務類型

## 系統架構

### 技術堆疊
- **前端**: Next.js 15, TypeScript, Tailwind CSS
- **後端**: Next.js API Routes, SQLite
- **定時任務**: node-cron + 自定義任務調度器
- **資料庫**: better-sqlite3
- **容器化**: Docker, Docker Compose

### 專案結構
```
daily-message/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── config/          # 配置管理API
│   │   │   ├── logs/            # 日誌查詢API
│   │   │   ├── tasks/           # 任務管理API
│   │   │   ├── scheduled-tasks/ # 排程任務API
│   │   │   └── health/          # 健康檢查API
│   │   ├── settings/
│   │   │   ├── ai/              # AI設定頁面
│   │   │   ├── schedule/        # 定時任務管理頁面
│   │   │   └── telegram/        # Telegram設定頁面
│   │   ├── manage-schedule/     # 任務管理主頁面
│   │   │   ├── [id]/            # 任務編輯頁面
│   │   │   └── page.tsx         # 任務列表頁面
│   │   ├── globals.css          # 全域樣式
│   │   ├── layout.tsx           # 佈局元件
│   │   └── page.tsx             # 首頁
│   ├── lib/
│   │   ├── db.ts                # SQLite資料庫管理
│   │   ├── config.ts            # 配置邏輯
│   │   ├── openai.ts            # OpenAI API客戶端
│   │   ├── telegram.ts          # Telegram API客戶端
│   │   ├── scheduler.ts         # 定時任務調度器
│   │   └── tasks/               # 任務系統
│   │       ├── index.ts         # 任務系統入口
│   │       ├── TaskHandler.ts   # 任務處理器基類
│   │       ├── TaskRegistry.ts  # 任務註冊系統
│   │       └── handlers/        # 具體任務實現
│   │           └── DailyMessageTask.ts
├── scripts/
│   ├── init-db.js               # 資料庫初始化
│   ├── test-core.js             # 核心測試腳本
│   ├── test-scheduler.js        # 排程器測試
│   └── test-scheduled-tasks-api.js # API測試
├── data/
│   └── database.sqlite          # SQLite資料庫檔案
├── docker-compose.yml           # Docker Compose配置
├── Dockerfile                   # Docker配置
├── nginx.conf                   # Nginx配置
└── .env.example                 # 環境變數範例
```

## 快速開始

### 本地開發

1. **安裝依賴**
```bash
npm install
```

2. **初始化資料庫**
```bash
npm run init-db
```

3. **啟動開發伺服器**
```bash
npm run dev
```

4. **開啟設定頁面**
- AI設定: http://localhost:3000/settings/ai
- 任務管理: http://localhost:3000/manage-schedule
- Telegram設定: http://localhost:3000/settings/telegram

### Docker部署

1. **使用Docker Compose**
```bash
docker-compose up -d
```

2. **單獨Docker運行**
```bash
docker build -t daily-message .
docker run -p 3000:3000 -v ./data:/app/data daily-message
```

## 功能頁面說明

### 任務管理主頁面 (/manage-schedule)
- **任務列表**: 顯示所有排程任務的詳細資訊
- **即時狀態**: 排程器運行狀態、任務統計
- **操作功能**: 新增、編輯、刪除、啟用/停用、測試執行
- **搜尋過濾**: 依狀態、類型、關鍵字篩選任務

### AI設定頁面 (/settings/ai)
- **API端點**: OpenAI相容API的URL
- **API金鑰**: 您的API存取金鑰
- **模型選擇**: 支援的AI模型列表
- **超時設定**: API請求超時時間
- **重試次數**: 失敗時的重試次數
- **測試功能**: 即時測試API連線

### 任務編輯頁面 (/manage-schedule/[id])
- **基本設定**: 任務名稱、描述、執行時間
- **任務類型**: 選擇不同的任務處理器
- **配置參數**: 根據任務類型設定特定參數
- **進階選項**: 重試次數、超時時間、優先級

### Telegram Bot設定頁面 (/settings/telegram)
- **目標API URL**: Telegram Bot API端點
- **Bot密碼**: 用於認證的密碼
- **頻道ID**: 訊息發送的目標頻道
- **訊息模板**: 支援變數的自定義模板

## 任務系統架構

### 任務類型
系統採用模組化設計，支援多種任務類型：

1. **每日訊息 (daily_message)**
   - 使用AI生成每日訊息
   - 發送到Telegram頻道
   - 可自定義提示詞和模板

2. **天氣報告 (weather_report)** *(預留)*
   - 獲取天氣資訊
   - 生成天氣報告
   - 支援多城市設定

### 任務配置結構
每個任務包含以下核心欄位：
- `id`: 任務唯一識別碼
- `name`: 任務名稱
- `description`: 任務描述
- `cron_expression`: Cron表達式
- `timezone`: 時區設定
- `task_type`: 任務類型
- `config`: 任務特定配置(JSON)
- `is_enabled`: 啟用狀態
- `max_retries`: 最大重試次數
- `timeout_seconds`: 超時時間
- `priority`: 優先級

### 任務生命週期
1. **註冊**: 任務類型向系統註冊
2. **建立**: 使用者建立新任務
3. **排程**: 系統根據cron表達式排程
4. **執行**: 到達執行時間自動執行
5. **記錄**: 執行結果記錄到日誌
6. **重試**: 失敗時根據設定重試

## 配置管理

### 資料庫結構
系統使用SQLite儲存所有配置，主要包含以下表格：

- **scheduled_tasks**: 排程任務表
- **task_logs**: 任務執行日誌
- **system_config**: 系統配置表

### 配置項目

#### AI配置
| 配置鍵 | 說明 | 預設值 |
|--------|------|--------|
| `openai_api_url` | OpenAI API端點 | https://api.openai.com/v1/chat/completions |
| `openai_api_key` | API金鑰 | (空) |
| `openai_model` | 使用的模型 | gpt-3.5-turbo |

#### 系統配置
| 配置鍵 | 說明 | 預設值 |
|--------|------|--------|
| `timezone` | 預設時區 | Asia/Taipei |
| `max_concurrent_tasks` | 最大並發任務數 | 5 |

#### Telegram Bot配置
| 配置鍵 | 說明 | 預設值 |
|--------|------|--------|
| `telegram_api_url` | 目標API URL | https://tg-bot-python.hhhk.7182818.xyz/send-message |
| `telegram_bot_password` | Bot密碼 | Ihave2jj |
| `telegram_channel_id` | 頻道ID | 585426653 |
| `telegram_message_template` | 訊息模板 | {ai_response} |

## API文件

### 任務管理API
- `GET /api/tasks` - 獲取所有任務
- `POST /api/tasks` - 建立新任務
- `PUT /api/tasks` - 更新任務
- `DELETE /api/tasks` - 刪除任務
- `POST /api/tasks/test` - 測試執行任務
- `POST /api/tasks/control` - 控制排程器(啟動/停止)

### 配置管理API
- `GET /api/config` - 獲取所有配置
- `PUT /api/config` - 更新配置
- `POST /api/config/test` - 測試AI連線
- `POST /api/config/validate-cron` - 驗證cron表達式
- `POST /api/config/telegram/test` - 測試Telegram API

### 日誌查詢API
- `GET /api/logs` - 獲取執行日誌
- `GET /api/scheduled-tasks` - 獲取排程任務狀態

### 健康檢查API
- `GET /api/health` - 系統健康狀態檢查

## 開發指南

### 開發環境設定
1. 複製環境變數範例
```bash
cp .env.example .env.local
```

2. 安裝開發依賴
```bash
npm install
```

3. 初始化開發資料庫
```bash
npm run dev:init
```

### 開發腳本
```bash
npm run dev          # 啟動開發伺服器
npm run build        # 建置專案
npm run start        # 啟動生產伺服器
npm run init-db      # 初始化資料庫
npm run test         # 執行測試
npm run docker:build # 建置Docker映像
npm run docker:run   # 運行Docker容器
npm run docker:compose # 使用Docker Compose
```

### 新增任務類型

要新增自定義任務類型，請遵循以下步驟：

1. **建立任務處理器類別**
```typescript
// src/lib/tasks/handlers/YourTask.ts
import { TaskHandler } from '../TaskHandler';

export class YourTask extends TaskHandler {
  taskType = 'your_task_type';
  name = '您的任務名稱';
  description = '任務描述';

  async execute(config: any): Promise<any> {
    // 實作任務邏輯
    return { success: true, message: '任務執行成功' };
  }

  validateConfig(config: any) {
    // 驗證配置
    return { valid: true };
  }
}
```

2. **註冊任務類型**
```typescript
// 在系統初始化時註冊
import { YourTask } from './handlers/YourTask';
import { TaskRegistry } from './TaskRegistry';

TaskRegistry.register(new YourTask());
```

### 專案開發計劃

#### Phase 1: 基礎建置 ✅
- ✅ 系統架構設計
- ✅ 資料庫結構設計
- ✅ 專案結構規劃
- ✅ Web UI配置欄位設計
- ✅ 依賴套件安裝

#### Phase 2: 核心功能開發 ✅
- ✅ SQLite配置管理模組
- ✅ AI設定頁面
- ✅ 定時任務管理頁面
- ✅ Telegram Bot配置頁面
- ✅ 配置管理API
- ✅ OpenAI API客戶端
- ✅ Telegram Bot API發送模組
- ✅ 定時任務調度器

#### Phase 3: 任務系統升級 ✅
- ✅ 模組化任務架構
- ✅ 任務註冊系統
- ✅ 多任務類型支援
- ✅ 任務管理Web UI
- ✅ 任務執行日誌
- ✅ 任務測試功能

#### Phase 4: 部署準備 ✅
- ✅ Dockerfile和docker-compose
- ✅ 環境變數配置
- ✅ 整體功能測試
- ✅ 文件完善

## 故障排除

### 常見問題

**Q: 如何新增自定義任務類型？**
A: 參考開發指南中的「新增任務類型」章節，建立新的任務處理器並註冊到系統。

**Q: 任務沒有自動執行？**
A: 檢查以下項目：
1. 排程器是否已啟動（查看任務管理頁面狀態）
2. 任務是否設定為啟用狀態
3. Cron表達式是否正確
4. 時區設定是否符合預期

**Q: 如何測試任務是否正常？**
A: 在任務管理頁面點擊「測試執行」按鈕，系統會立即執行該任務並顯示結果。

**Q: 資料庫初始化失敗**
A: 確保 `data/` 目錄存在且有寫入權限
```bash
mkdir -p data
chmod 755 data
```

**Q: API測試失敗**
A: 檢查網路連線和API金鑰是否正確

### 日誌查看
```bash
# 查看應用程式日誌
npm run dev

# 查看資料庫內容
sqlite3 data/database.sqlite
```

## 貢獻指南

歡迎提交Issue和Pull Request！請遵循以下步驟：

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案
