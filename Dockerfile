FROM node:18-alpine

WORKDIR /app

# 複製 package files
COPY package*.json ./
RUN npm ci --only=production

# 複製應用程式碼
COPY . .

# 建立應用程式
RUN npm run build

# 建立資料目錄
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 啟動應用程式
CMD ["npm", "start"]