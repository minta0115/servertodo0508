# Railway 部署清单

✅ **部署准备状态: 已就绪**

## 已完成的准备工作

- ✅ 项目结构: 单一Monorepo，前后端统一管理
- ✅ package.json (root): 配置workspaces和部署脚本
- ✅ Procfile: 配置Railway启动命令
- ✅ 前端构建: 自动集成到部署流程
- ✅ 后端配置: 支持生产环境静态文件服务
- ✅ Git仓库: 初始化完成，第一次提交已创建
- ✅ .gitignore: 配置忽略规则
- ✅ 文档: README、DEPLOYMENT、QUICKSTART完成

## 立即执行的步骤

### 步骤 1: 创建GitHub仓库 (5分钟)
```
1. 访问 https://github.com/new
2. 填写:
   - Repository name: todo-ai-app
   - Description: AI-powered todo extraction and management system
   - Visibility: Public
3. 点击 "Create repository"
```

### 步骤 2: 推送代码到GitHub (2分钟)
```powershell
cd E:\AIcode\0011

# 替换 YOUR_USERNAME 为你的GitHub用户名
git remote add origin https://github.com/YOUR_USERNAME/todo-ai-app.git
git branch -M main
git push -u origin main
```

### 步骤 3: 连接Railway (3分钟)
```
1. 访问 https://railway.app/dashboard
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权GitHub（如首次使用）
5. 搜索并选择 todo-ai-app
6. 点击 "Deploy Now"
```

### 步骤 4: 配置环境变量 (2分钟)
等待Railway部署进行中（查看Logs），完成后：
```
1. 进入项目 → 点击服务名称
2. 进入 "Variables" 标签
3. 添加以下变量:

   NODE_ENV: production
   JWT_SECRET: [生成随机字符串]
   DEFAULT_NVIDIA_API_KEY: nvapi-test-key
   DEFAULT_MINIMAX_API_KEY: mm-test-key

4. 点击 "Redeploy" 应用新变量
```

### 步骤 5: 获取URL并测试 (1分钟)
```
1. 在Railway仪表板找到 "Domains" 部分
2. 复制自动生成的domain URL
3. 在浏览器中访问
4. 注册账号并测试所有功能
```

## 总耗时: 约13分钟

---

## 项目部署配置详解

### Procfile
```
web: npm start --prefix server-cloud
```
- 告诉Railway如何启动应用
- `npm start` 执行根package.json的start脚本
- start脚本包含: `npm run build && npm start --prefix server-cloud`
  - 先构建前端: `npm run build --prefix client`
  - 再启动后端: `npm start --prefix server-cloud`

### 为什么这个配置有效?

1. **单一进程模型**: Railway上每个服务容器运行一个主进程
   - start脚本运行两步: 构建 + 服务器启动
   - 服务器同时提供API和静态前端文件

2. **前端集成**: 
   - 部署时运行 `npm run build --prefix client`
   - 前端资源输出到 `client/dist/`
   - 服务器配置: 生产环境下从 `../../client/dist` 提供静态文件

3. **成本优化**: 单一Railway实例即可运行完整应用，节省成本

### 替代部署方案 (可选)

#### 方案 A: 使用Railway服务分离 (成本 ≈ 2x)
- 前端: Vercel/Netlify (免费)
- 后端: Railway单独服务

#### 方案 B: 完整解耦 (更复杂)
- 前端: Railway独立服务
- 后端: Railway独立服务
- 需要修改Procfile和配置CORS

**推荐**: 保持当前配置（方案 Current），最简单且成本最低。

---

## 部署后验证清单

部署完成后，验证以下功能:

- [ ] 访问应用首页正常加载
- [ ] 注册新账号成功
- [ ] 登录功能正常
- [ ] 输入文本并点击分析能提取待办事项
- [ ] 待办事项正确显示在列表中
- [ ] 完成/删除待办事项功能正常
- [ ] 用户菜单在右上角可见
- [ ] 浮动添加按钮在右下角可见
- [ ] 切换标签 (Analysis/Calendar/List) 正常
- [ ] 设置页面可访问

---

## Railway仪表板导航速查

| 任务 | 位置 |
|------|------|
| 查看部署日志 | 项目 → 服务 → Logs |
| 设置环境变量 | 项目 → 服务 → Variables |
| 查看域名 | 项目 → 服务 → Domains |
| 重新部署 | Logs中的按钮或Events中的Redeploy |
| 查看成本 | 项目 → Settings → Usage |
| 查看构建历史 | 项目 → Deployments |

---

## 常见问题速查

**Q: 部署卡在"Building"?**
A: 正常，通常需要3-5分钟。查看Logs看进度。

**Q: 环境变量设置后为什么还是报错?**
A: 需要重新部署。Railway不会自动应用新变量，需要点击"Redeploy"。

**Q: 如何更新线上代码?**
A: 本地修改后推送到GitHub:
```bash
git add .
git commit -m "Fix: ..."
git push origin main
```
Railway自动检测到新提交并重新部署。

**Q: 如何回滚到之前版本?**
A: 
方法1: Railway仪表板 → Events → 找到旧版本 → Rollback
方法2: Git回滚 → 推送到GitHub → 自动重新部署

---

## 下一步建议

部署完成后:

1. **测试所有功能** ✓ 验证应用正常运行
2. **配置自定义域名** (可选) 使用自己的域名
3. **添加PostgreSQL数据库** (可选) 替换内存存储
4. **设置自动备份** (可选) 如使用数据库
5. **监控成本** 定期检查使用情况
6. **继续开发** 修改功能后push自动更新线上

---

**部署准备完成！按照"立即执行的步骤"开始部署吧！** 🚀
