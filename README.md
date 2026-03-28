# 兔兔信件小屋 - Bunny Letter Game

一个可爱的AI兔兔写信互动应用，主人给兔兔写信，兔兔会用AI自动回信。

## 功能特性

- ✨ 主人给小兔子写信，AI自动生成回信
- 🔔 未读回信小红点提示
- ⏰ 超过2小时主人不写信，小兔子会主动发信
- 🔒 AI配置安全存储，API密钥不会暴露到前端
- ⚙️ 独立后台配置页面，可修改AI提示词和配置

## 技术架构

- **后端**：Node.js + Express + Prisma ORM
- **数据库**：SQLite（轻量，适合单用户场景）
- **前端**：原生JavaScript + CSS
- **AI**：火山方舟Ark大模型API

## 本地开发

### 安装依赖
```bash
npm install
```

### 环境配置
复制 `.env` 并修改配置：
```
DATABASE_URL="file:./dev.db"
PORT=3000
ENCRYPTION_KEY=your-encryption-key
DEFAULT_API_URL=https://ark.cn-beijing.volces.com/api/coding/v3
DEFAULT_API_KEY=your-api-key
DEFAULT_MODEL_ID=ark-code-latest
```

### 初始化数据库
```bash
npx prisma generate
npx prisma db push
```

### 启动服务
```bash
node server.js
```

访问：
- 前台：http://localhost:3000
- 后台配置：http://localhost:3000/admin

## 部署

### 使用PM2部署
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx反向代理示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 目录结构

```
bunny-letter-game/
├── backend/
│   ├── prisma/          # Prisma配置和数据库
│   ├── routes/          # API路由
│   ├── services/        # 业务服务
│   ├── utils/           # 工具函数
│   ├── app.js           # Express应用
│   └── admin.html       # 后台配置页面
├── frontend/            # 前端静态文件
│   ├── index.html
│   ├── style.css
│   └── script.js
├── server.js            # 启动入口
├── package.json
├── .env
└── ecosystem.config.js  # PM2配置
```

## 安全说明

- API密钥始终加密存储在后端数据库
- 敏感API仅在后端调用，前端无法访问
- 前端只能获取公开的提示词内容，无法获取API密钥
