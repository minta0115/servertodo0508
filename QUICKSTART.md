# 快速启动指南

5分钟内让应用运行起来。

## 本地开发（5分钟）

### 1. 安装依赖
```bash
cd E:\AIcode\0011
npm install
```
这会自动安装根目录、`server-cloud/` 和 `client/` 的所有依赖。

### 2. 启动开发服务器
```bash
npm run dev
```

输出应该看起来像：
```
▲ [06:12:00] dev
> concurrently "npm run dev --prefix server-cloud" "npm run dev --prefix client"

> server running on port 3001
> VITE v5.4.21 ready in 150 ms

  ➜  Local:   http://localhost:5173/
```

### 3. 打开浏览器
打开 http://localhost:5173

### 4. 测试应用
1. **注册**: 输入邮箱、密码注册账号
2. **输入文本**: 在"Analysis"标签粘贴或输入文本，如：
   ```
   今天下午3点开会
   明天完成报告
   周五前提交代码审查
   ```
3. **点击分析**: 系统会提取出3条待办事项

完成！🎉

---

## 生产部署（到Railway）

### 前置条件
- GitHub账号（免费注册 github.com）
- Railway账号（免费注册 railway.app）

### 1. 推送代码到GitHub
```bash
# 初始化git仓库
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"
git add .
git commit -m "Initial commit"
git branch -M main

# 创建GitHub仓库后（在 https://github.com/new）
git remote add origin https://github.com/YOUR_USERNAME/todo-ai-app.git
git push -u origin main
```

### 2. 在Railway部署
1. 访问 https://railway.app/dashboard
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择 `todo-ai-app` 仓库
4. 自动部署开始

### 3. 设置环境变量
部署完成后，在Railway仪表板设置：
```
NODE_ENV: production
JWT_SECRET: (生成安全的随机字符串)
DEFAULT_NVIDIA_API_KEY: nvapi-test-key
DEFAULT_MINIMAX_API_KEY: mm-test-key
```

### 4. 访问上线应用
Railway会生成一个公开URL（如 `todo-ai-app-production-xxx.up.railway.app`）
访问即可使用！

---

## 常用命令

```bash
# 开发
npm run dev         # 启动前后端开发服务器
npm run client      # 仅启动前端
npm run server      # 仅启动后端

# 构建
npm run build       # 为生产构建前端

# 生产
npm start           # 构建前端并启动后端（Railway用）
```

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `README.md` | 完整项目说明 |
| `DEPLOYMENT.md` | Railway详细部署指南 |
| `Procfile` | Railway启动配置 |
| `.gitignore` | Git忽略规则 |
| `package.json` | 根项目配置（workspaces） |
| `server-cloud/` | Node.js后端API |
| `client/` | React前端应用 |

---

## 问题排查

### 前端无法加载？
```bash
# 检查是否在 http://localhost:5173
# 如果是 http://localhost:3001，点击刷新或使用正确的端口
```

### 后端返回404错误？
```bash
# 检查后端是否运行
curl http://localhost:3001/api/auth/login
# 应该返回 "No token provided" 而不是无法连接
```

### 部署失败？
1. 检查 `DEPLOYMENT.md` 的故障排查章节
2. 查看Railway仪表板的Logs
3. 验证GitHub仓库是否包含所有文件

---

## 下一步

- ✅ 本地开发? 修改代码、测试功能
- ✅ 部署到Railway? 按生产部署步骤操作
- 📖 了解更多? 阅读 `README.md` 和 `DEPLOYMENT.md`

---

**需要帮助?** 查看项目根目录的各个文档。
