# Daily Message Service

一個定時向OpenAI API發送訊息並轉發到指定POST API的服務，具備完整的Web設定介面和Docker支援。

## 功能特色

- 🤖 **OpenAI整合** - 支援自定義API端點和模型選擇
- ⏰ **定時任務** - 使用cron表達式設定執行時間
- 🎛️ **Web設定介面** - 直覺的設定頁面，無需手動修改檔案
- 📝 **SQLite儲存** - 所有配置和日誌使用SQLite管理
- 🐳 **Docker支援** - 完整的容器化部署方案
- 🔍 **即時測試** - 內建API連線測試功能
- 📱 **Telegram整合** - 專為Telegram Bot API優化的配置介面

## 系統架構

### 技術堆疊
- **前端**: Next.js 15, TypeScript, Tailwind CSS
- **後端**: Next.js API Routes, SQLite
- **定時任務**: node-cron
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
│   │   │   └── health/          # 健康檢查API
│   │   ├── settings/
│   │   │   ├── ai/              # AI設定頁面
│   │   │   └── schedule/        # 定時任務管理頁面
│   │   ├── globals.css          # 全域樣式
│   │   ├── layout.tsx           # 佈局元件
│   │   └── page.tsx             # 首頁
│   ├── lib/
│   │   ├── db.ts                # SQLite資料庫管理
│   │   ├── config.ts            # 配置邏輯
│   │   ├── openai.ts            # OpenAI API客戶端
│   │   ├── telegram.ts          # Telegram API客戶端
│   │   └── scheduler.ts         # 定時任務調度器
├── scripts/
│   ├── init-db.js               # 資料庫初始化
│   └── test-core.js             # 測試腳本
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
- 定時任務: http://localhost:3000/settings/schedule

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

## 設定頁面說明

### AI設定頁面 (/settings/ai)
- **API端點**: OpenAI相容API的URL
- **API金鑰**: 您的API存取金鑰
- **模型選擇**: 支援的AI模型列表
- **超時設定**: API請求超時時間
- **重試次數**: 失敗時的重試次數
- **測試功能**: 即時測試API連線

### 定時任務管理頁面 (/settings/schedule)

#### 基本設定
- **執行時間**: 使用cron表達式設定每日執行時間 (例如: 0 9 * * *)
- **時區設定**: 選擇您的本地時區 (預設: Asia/Taipei)
- **訊息內容**: 每日發送給AI的訊息內容

#### Telegram Bot API設定
**所有欄位都可在Web UI中直接修改：**

| 欄位名稱 | Web UI顯示名稱 | 範例值 | 說明 |
|----------|----------------|--------|------|
| `telegram_api_url` | **目標API URL** | `https://tg-bot-python.hhhk.7182818.xyz/send-message` | Telegram Bot API端點 |
| `telegram_bot_password` | **Bot密碼** | `Ihave2jj` | 用於認證的密碼 |
| `telegram_channel_id` | **頻道ID** | `585426653` | 訊息發送的目標頻道 |
| `telegram_message_template` | **訊息模板** | `{ai_response}` | 支援變數: {ai_response}, {timestamp}, {date} |

#### 即時預覽功能
Web UI提供即時預覽，顯示實際發送的內容：
```
POST https://tg-bot-python.hhhk.7182818.xyz/send-message
Content-Type: application/json

{
  "password": "Ihave2jj",
  "message": "AI回應內容將顯示在這裡",
  "channel_id": "585426653"
}
```

#### 測試功能
- **測試發送**: 使用當前配置立即發送測試訊息
- **即時回饋**: 顯示API回應狀態和錯誤訊息
- **歷史記錄**: 查看過去的執行結果

## 配置管理

### 資料庫結構
系統使用SQLite儲存所有配置，主要包含以下表格：

- **system_config**: 系統配置表
- **task_logs**: 任務執行日誌

### 配置項目

#### AI配置
| 配置鍵 | 說明 | 預設值 |
|--------|------|--------|
| `openai_api_url` | OpenAI API端點 | https://api.openai.com/v1/chat/completions |
| `openai_api_key` | API金鑰 | (空) |
| `openai_model` | 使用的模型 | gpt-3.5-turbo |

#### 定時任務配置
| 配置鍵 | 說明 | 預設值 |
|--------|------|--------|
| `daily_message` | 每日訊息 | 請提供今日的一句話 |
| `schedule_time` | 執行時間 | 0 9 * * * (每天9點) |
| `timezone` | 時區 | Asia/Taipei |

#### Telegram Bot配置
| 配置鍵 | Web UI欄位 | 預設值 |
|--------|------------|--------|
| `telegram_api_url` | 目標API URL | https://tg-bot-python.hhhk.7182818.xyz/send-message |
| `telegram_bot_password` | Bot密碼 | Ihave2jj |
| `telegram_channel_id` | 頻道ID | 585426653 |
| `telegram_message_template` | 訊息模板 | {ai_response} |

## API文件

### 配置管理API
- `GET /api/config` - 獲取所有配置
- `PUT /api/config` - 更新配置
- `POST /api/config/test` - 測試AI連線
- `POST /api/config/validate-cron` - 驗證cron表達式
- `POST /api/config/telegram/test` - 測試Telegram API

### 日誌查詢API
- `GET /api/logs` - 獲取執行日誌
- `GET /api/logs/latest` - 獲取最新日誌

### 健康檢查API
- `GET /api/health` - 系統健康狀態檢查

## Web UI配置欄位詳細說明

### 可透過Web UI修改的欄位

#### 1. AI設定頁面 (/settings/ai)
- **OpenAI API URL**: 可編輯的文字輸入框
- **API金鑰**: 密碼輸入框，支援顯示/隱藏
- **模型選擇**: 下拉選單 (gpt-3.5-turbo, gpt-4等)
- **超時時間**: 數字輸入框 (毫秒)
- **重試次數**: 數字輸入框

#### 2. 定時任務管理頁面 (/settings/schedule)

##### 基本設定區塊
- **執行時間**: Cron表達式輸入框，附格式說明
- **時區**: 下拉選單選擇時區
- **每日訊息**: 多行文字輸入框

##### Telegram Bot設定區塊
```
┌─────────────────────────────────────────┐
│ Telegram Bot API設定                    │
├─────────────────────────────────────────┤
│ 目標API URL:                            │
│ [https://tg-bot-python.hhhk.7182818.xyz/send-message] │
│                                         │
│ Bot密碼:                               │
│ [••••••••] [顯示/隱藏]                 │
│                                         │
│ 頻道ID:                                │
│ [585426653]                            │
│                                         │
│ 訊息模板:                              │
│ [ {ai_response} ]                      │
│ 可用變數: {ai_response}, {timestamp}   │
│                                         │
│ [測試發送] [儲存設定]                  │
└─────────────────────────────────────────┘
```

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

#### Phase 3: 功能整合 ✅
- ✅ API Routes建立
- ✅ Web UI頁面
- ✅ 測試腳本建立

#### Phase 4: 部署準備 ✅
- ✅ Dockerfile和docker-compose
- ✅ 環境變數配置
- ✅ 整體功能測試
- ✅ 文件完善

## 故障排除

### 常見問題

**Q: 如何修改Telegram Bot的URL、密碼、頻道ID？**
A: 透過Web UI直接修改：
1. 開啟 http://localhost:3000/settings/schedule
2. 在「Telegram Bot API設定」區塊修改對應欄位
3. 點擊「儲存設定」即可立即生效

**Q: 資料庫初始化失敗**
A: 確保 `data/` 目錄存在且有寫入權限
```bash
mkdir -p data
chmod 755 data
```

**Q: API測試失敗**
A: 檢查網路連線和API金鑰是否正確

**Q: 定時任務未執行**
A: 確認cron表達式格式正確，時區設定符合預期

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
