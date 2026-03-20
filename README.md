# auth-kit

可复用的邮箱验证码登录/注册组件。

## 技术栈
- 前端：React
- 后端：Node.js + Express
- 数据库：MySQL
- 邮件：Nodemailer（SMTP 自定义配置）

## 目录结构
```
auth-kit/
├── server/          # 后端
│   ├── index.js     # 入口
│   ├── db.js        # 数据库连接
│   ├── routes/
│   │   └── auth.js  # 登录/注册/验证码接口
│   └── mailer.js    # 邮件发送
├── client/          # 前端
│   ├── index.html
│   └── app.jsx      # 登录/注册组件
├── admin/           # 邮箱配置后台
│   └── index.html
├── .env.example
└── init.sql         # 数据库初始化
```

## 快速开始

1. 创建数据库，执行 `init.sql`
2. 复制 `.env.example` 为 `.env`，填入配置
3. 安装依赖：`cd server && npm install`
4. 启动：`node index.js`
5. 访问 `http://localhost:3000`

## 部署
推荐 PM2：
```bash
npm install -g pm2
pm2 start server/index.js --name auth-kit
pm2 save
```
