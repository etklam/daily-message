# 多階段構建 - 依賴安裝階段
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 複製 package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 多階段構建 - 建構階段
FROM node:18-alpine AS builder
WORKDIR /app

# 複製依賴
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 安裝所有依賴（包括 devDependencies）並建構
RUN npm ci && npm run build

# 多階段構建 - 運行階段
FROM node:18-alpine AS runner
WORKDIR /app

# 創建非 root 用戶
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 安裝 curl 用於健康檢查
RUN apk add --no-cache curl

# 複製必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts

# 建立資料目錄並設置權限
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
RUN chown -R nextjs:nodejs /app

# 暴露端口
EXPOSE 3000

# 切換到非 root 用戶
USER nextjs

# 設置環境變數
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 啟動應用程式
CMD ["node", "server.js"]