# 待办事项AI智能提取系统

一个全栈应用，使用AI自动识别和提取待办事项，支持云端部署和移动端访问。

## 功能特性

- 🤖 **AI智能识别**: 使用NVIDIA NIM或MiniMax自动从文本/截图中提取待办事项
- 📱 **PWA应用**: 支持安装为桌面应用或移动应用，离线可用
- 🟢 **绿色iOS风格UI**: 现代化设计，支持响应式布局
- 📊 **数据分析**: 完成度统计、任务分析、AI建议
- 📅 **日历视图**: 按日期查看待办事项
- ⏰ **提醒功能**: 逾期、今天、明天、N天、7天内等智能提醒
- 🌐 **云端部署**: 部署到Railway实现24/7可用性

## 技术栈

### 前端
- React 18 + Vite
- PWA with Workbox
- Tesseract.js (OCR)
- Axios (HTTP客户端)

### 后端
- Node.js + Express
- JWT认证
- 开发环境: 内存数据库
- 生产环境: PostgreSQL

### 部署
- Railway平台（一体化部署）
- GitHub集成
- 自动HTTPS

## 本地开发

### 前置条件
- Node.js 16+
- npm 8+

### 安装

```bash
git clone https://github.com/your-username/todo-ai-app.git
cd todo-ai-app
npm install
```

### 启动开发服务器

```bash
npm run dev
```

前端: http://localhost:5173
后端: http://localhost:3001

### 构建生产版本

```bash
npm run build
```

前端资源输出到 `client/dist/`

## Railway部署

### 快速部署步骤

1. **创建GitHub仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/todo-ai-app.git
   git push -u origin main
   ```

2. **连接到Railway**
   - 访问 https://railway.app
   - 使用GitHub账号登录
   - 新建项目 → 选择"From GitHub Repo"
   - 授权并选择 todo-ai-app 仓库
   - Railway自动检测package.json和Procfile

3. **配置环境变量**
   在Railway仪表板设置：
   ```
   NODE_ENV=production
   JWT_SECRET=your-secure-random-secret
   DEFAULT_NVIDIA_API_KEY=your-api-key
   DEFAULT_MINIMAX_API_KEY=your-api-key
   ```

4. **添加数据库**（可选）
   - 在Railway项目中添加PostgreSQL插件
   - 环境变量DATABASE_URL自动设置

5. **部署**
   - 自动触发或手动点击部署
   - 访问Railway分配的公开域名

## API文档

### 认证
- `POST /api/auth/register` - 注册用户
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### 待办事项
- `POST /api/todos/parse` - 解析并创建待办事项
- `GET /api/todos` - 获取待办事项列表
- `PUT /api/todos/:id` - 更新待办事项
- `DELETE /api/todos/:id` - 删除待办事项

### 分析
- `GET /api/analysis` - 获取分析数据和建议

## 项目结构

```
todo-ai-app/
├── client/                 # React前端应用
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面
│   │   ├── context/       # 上下文（认证等）
│   │   ├── services/      # API服务
│   │   └── App.jsx
│   └── vite.config.js
├── server-cloud/          # Node.js后端API
│   ├── src/
│   │   ├── server.js      # Express应用
│   │   ├── services/      # 业务逻辑（AI解析等）
│   │   └── middleware/    # 中间件
│   ├── package.json
│   └── .env.example
├── package.json           # 根项目配置（workspaces）
├── Procfile              # Railway部署配置
├── .railwayignore        # Railway忽略文件
└── README.md
```

## 配置文件说明

- **Procfile**: Railway启动脚本，指定运行 `npm start` 启动后端并提供静态前端文件
- **.env.example**: 环境变量示例，实际部署时在Railway仪表板设置
- **package.json (root)**: 定义workspaces、脚本和并发命令

## 常见问题

### 前端无法连接后端API
在生产环境中，前端和后端运行在同一个Railway实例上。确保：
- 前端构建包含在部署中（npm run build）
- 后端在生产环境下提供静态文件服务

### 如何使用自己的AI API密钥
在Railway仪表板→项目变量中修改：
- `DEFAULT_NVIDIA_API_KEY`: NVIDIA NIM API密钥
- `DEFAULT_MINIMAX_API_KEY`: MiniMax API密钥

### 如何连接数据库
Railway提供PostgreSQL插件。添加后会自动设置DATABASE_URL。
服务器代码需要修改以使用真实数据库（当前为演示的内存存储）。

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request！

---

**部署状态**: [![Railway](https://img.shields.io/badge/Railway-deployed-green)](https://railway.app)
