# Railway 部署指南

本文详细说明如何将todo-ai-app部署到Railway平台。

## 部署概览

- **平台**: Railway.app
- **部署模式**: GitHub集成
- **前后端**: 统一部署到单个Railway实例
- **可用性**: 24/7全球访问

## 前置准备

### 1. 本地项目准备完成
确保所有代码已提交到本地Git仓库：
```bash
cd E:\AIcode\0011
git status  # 应该显示 "nothing to commit"
```

### 2. GitHub账号
- 创建或登录 https://github.com
- 确保有权创建新仓库

### 3. Railway账号
- 访问 https://railway.app
- 使用GitHub账号登录（推荐）

## 部署步骤

### 步骤1: 初始化本地Git仓库

```bash
cd E:\AIcode\0011

# 如果还没有git仓库
git init

# 配置git用户（首次使用）
git config user.email "your-email@example.com"
git config user.name "Your Name"

# 添加所有文件
git add .

# 创建初始提交
git commit -m "Initial commit: AI-powered todo extraction system"

# 重命名分支为main
git branch -M main
```

### 步骤2: 创建GitHub仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `todo-ai-app`
   - **Description**: `AI-powered todo extraction and management system`
   - **Visibility**: Public（Railway需要访问权限）
   - **Initialize repository**: 不勾选（我们已经有本地仓库）

3. 点击"Create repository"

4. 按照GitHub提示，在本地运行：
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/todo-ai-app.git
   git push -u origin main
   ```

### 步骤3: 连接Railway

1. 访问 https://railway.app/dashboard
2. 点击 **"New Project"** → **"Deploy from GitHub repo"**
3. 授权GitHub访问（如果首次使用）
4. 搜索并选择 `todo-ai-app` 仓库
5. 点击 **"Deploy Now"**

Railway会自动：
- 检测 Procfile
- 读取 package.json
- 安装依赖
- 构建前端
- 启动后端服务

### 步骤4: 配置环境变量

Railway部署后，需要设置环境变量：

1. 在Railway仪表板找到你的项目
2. 进入项目 → 点击服务名称
3. 找到 **"Variables"** 标签
4. 添加以下变量：

```
NODE_ENV: production
JWT_SECRET: [生成一个安全的随机字符串，例如用 node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
DEFAULT_NVIDIA_API_KEY: nvapi-test-key
DEFAULT_MINIMAX_API_KEY: mm-test-key
```

### 步骤5: 获取部署URL

1. 在Railway项目仪表板找到 **"Domains"** 部分
2. 查看自动生成的domain，格式如: `todo-ai-app-production-xxx.up.railway.app`
3. 访问这个URL来使用应用

### 步骤6: 添加数据库（可选，用于生产环境）

如果想使用实时数据库而不是内存存储：

1. 在Railway项目中点击 **"+ Add Service"**
2. 选择 **"Database"** → **"PostgreSQL"**
3. 创建后，`DATABASE_URL` 环境变量会自动添加
4. 代码需要修改以使用真实数据库连接

## 部署后测试

### 访问应用

1. 打开Railway自动生成的domain URL
2. 注册新账号或使用之前的账号登录
3. 测试所有功能

### 常见URL

- 应用首页: `https://your-domain.up.railway.app/`
- 后端API: `https://your-domain.up.railway.app/api/`
- API示例:
  - 登录: `POST https://your-domain.up.railway.app/api/auth/login`
  - 获取待办: `GET https://your-domain.up.railway.app/api/todos`

## 更新部署

每当你在本地修改代码并想更新线上版本：

```bash
# 本地修改代码后
git add .
git commit -m "说明修改内容"
git push origin main  # 自动触发Railway重新部署
```

Railway会自动检测到新提交并重新部署。

## 部署故障排查

### 1. 部署失败，检查日志

1. 进入Railway项目 → 点击服务
2. 查看 **"Logs"** 标签看错误消息
3. 常见问题：
   - `npm ERR!`: 依赖安装失败，检查 package.json
   - `Port already in use`: Railway自动处理端口冲突
   - `Cannot find module`: 依赖缺失，检查 package.json 中是否列出

### 2. 环境变量未设置

如果看到 `Error: JWT_SECRET not set`:
- 确保所有必需变量已在Railway仪表板设置
- 部署后环境变量更改需要重新部署生效

### 3. 前端无法加载

检查：
- Railway的 Procfile 是否正确（`web: npm start --prefix server-cloud`）
- 根 package.json 的 start 脚本是否包含 `npm run build`
- 访问 `https://your-domain.up.railway.app/` 是否返回HTML

### 4. API 401 Unauthorized

API密钥问题：
- 确保 `DEFAULT_NVIDIA_API_KEY` 和 `DEFAULT_MINIMAX_API_KEY` 已设置
- 使用测试密钥（`nvapi-test-key` / `mm-test-key`）返回模拟数据
- 若使用真实API密钥，确保余额充足

## 监控和维护

### 查看运行状态

1. Railway仪表板 → 项目 → 服务
2. **"Logs"** 标签: 实时日志
3. **"Metrics"** 标签: CPU、内存、网络使用情况
4. **"Events"** 标签: 部署历史

### 成本管理

Railway提供免费额度：
- 每月$5免费抵额
- 超出部分按使用量计费
- 监控 **"Usage"** 标签了解成本

### 重启服务

如果服务出现问题，可以手动重启：
1. 进入服务页面
2. 点击 **"..."** 菜单 → **"Restart Service"**

## 回滚到之前版本

如果新部署出现问题：

1. Railway仪表板 → **"Events"** 标签
2. 找到最后一次成功部署
3. 点击该事件 → 选择 **"Rollback"**

或者在本地回滚Git：
```bash
git revert HEAD  # 创建一个撤销最近更改的新提交
git push origin main  # 推送触发重新部署
```

## 高级配置

### 自定义域名

如果想使用自己的域名（如 `todo.yourdomain.com`）：

1. 在Railway项目 → 服务 → **"Domains"**
2. 点击 **"Add Custom Domain"**
3. 输入你的域名，按照Railway指引设置DNS

### 备份数据

使用PostgreSQL时定期备份：
- Railway提供自动备份功能（Settings中配置）
- 可手动导出数据库

## 支持和问题

- Railway文档: https://docs.railway.app
- GitHub问题: 提交issue到你的仓库
- Railway社区: https://railway.app/chat

---

**祝部署顺利！如有问题，查看上述常见问题解决方案。**
