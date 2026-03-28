# 技术设计文档 - 兔兔信件小屋后端

## 1. 需求概述

现有纯前端静态项目，需要新增：
- 后端服务 + 数据库持久化
- AI自动回信功能
- 后台配置页面（AI设置、prompt配置）
- 未读消息提示
- 定时主动发信机制
- 保证API密钥安全不暴露到前端

## 2. 技术选型

| 层级 | 选型 | 理由 |
|------|------|------|
| 后端框架 | Node.js + Express | 轻量，和前端同语言，适合小项目 |
| 数据库 | SQLite | 单文件数据库，无需额外服务，部署简单，适合单用户场景 |
| ORM | Prisma | 类型安全，开发快速，迁移方便 |
| AI 调用 | 原生 fetch | 直接调用火山引擎ARK接口，无需额外依赖 |

## 3. 数据模型设计

### 3.1 User (用户)
- id: Integer (primary key)
- name: String
- createdAt: DateTime
- updatedAt: DateTime

当前固定1个用户，预留扩展。

### 3.2 Letter (信件)
- id: Integer (primary key)
- content: String (信件内容)
- sender: String ('user' | 'bunny') - 谁发送的
- isRead: Boolean (是否已读)
- createdAt: DateTime
- userId: Integer (外键关联User)

### 3.3 AIConfig (AI配置)
- id: Integer (primary key)
- apiUrl: String
- apiKey: String (加密存储)
- modelId: String
- systemPrompt: String (AI回信系统提示词)
- updatedAt: DateTime

只存储一条全局配置。

## 4. API设计

### 4.1 公开API（前端调用）

- `GET /api/letters` - 获取所有信件
- `POST /api/letters` - 用户写信，保存并触发AI回信
  - 请求: `{ content: string }`
  - 返回: `{ success: boolean, bunnyReply: Letter }`
- `GET /api/letters/unread-count` - 获取未读数量
- `POST /api/letters/:id/mark-read` - 标记已读
- `GET /api/prompt-public` - 获取用于回信的prompt说明（不返回敏感信息）
- `GET /api/check-active` - 检查最后发信时间，判断是否需要触发主动发信

### 4.2 后台管理API（AI配置）

- `GET /api/admin/config` - 获取当前配置（返回遮罩后的apiKey）
- `POST /api/admin/config` - 更新配置
- `POST /api/admin/reset-bunny-letter` - 手动触发小兔子主动发信（调试用）

## 5. 项目结构

```
bunny-letter-game/
├── frontend/                # 前端文件（原静态文件移动到这里）
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── ...(图片资源)
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # Prisma数据模型
│   ├── routes/
│   │   ├── letters.js       # 信件API
│   │   └── admin.js         # 后台API
│   ├── services/
│   │   ├── ai.js            # AI调用服务
│   │   └── scheduler.js     # 定时检查主动发信
│   ├── utils/
│   │   ├── crypto.js        # API密钥加密
│   │   └── logger.js
│   └── app.js               # Express入口
├── .env                     # 环境变量（包含加密密钥）
├── .gitignore
├── package.json
└── server.js                # 启动入口
```

## 6. 核心流程

### 6.1 用户写信流程
1. 用户在前端填写内容 → 调用 `POST /api/letters`
2. 后端保存用户信件到数据库
3. 从配置中读取AI信息，拼接prompt调用AI
4. AI生成回信，保存兔子回信到数据库
5. 返回回信给前端
6. 前端更新列表，触发未读提示

### 6.2 主动发信检查
- 后端启动时启动定时任务（每分钟检查一次）
- 如果距离上一次用户发信 > 2小时，且最后一封信不是兔子发的 → 兔子主动发信
- 主动发信也调用AI生成内容，保存到数据库

### 6.3 未读提示
- 前端每次加载时调用 `unread-count` 获取未读数
- 如果 > 0，显示小红点
- 用户打开信箱后，对所有未读调用 `mark-read`

### 6.4 API安全
- AI配置全部存储在后端数据库
- API密钥使用环境密钥加密存储
- 前端无法获取任何敏感信息
- 后台页面也在后端服务渲染/提供，只有本地/授权可访问

## 7. AI Prompt设计

默认系统prompt：
```
你现在是一只可爱软萌的小兔子，住在兔兔信件小屋里。你正在和你的主人通信。
请根据主人的来信，写一封简短可爱的回信。
要求：
1. 保持可爱的语气，使用小兔子的身份说话
2. 可以适当使用emoji，但不要太多
3. 回信要简短自然，像聊天一样
4. 内容要温暖治愈，回应主人的情绪
```

支持在后台页面修改这个prompt。

## 8. 部署说明

- 远程服务器: 14.103.60.103
- 部署路径: /var/www/bunny-letter-game/
- 使用 PM2 守护进程
- 前端静态文件由Express托管
- 后端服务端口: 建议 3000，通过Nginx反向代理

## 9. 前端修改点

1. 原localStorage改为调用后端API
2. 添加未读小红点逻辑（需求已存在，改为从后端获取）
3. 新增后台配置页面入口（只在后台显示）
4. 请求结构适配新API
