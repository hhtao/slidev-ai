# 🛡️ 配置文件保护解决方案

## 问题描述
前端配置文件（特别是导航栏、路由和Vite配置）频繁被还原，导致知识库模块和智能生成模块从导航栏中消失。

## 已实施的解决方案

### 1. 自动修复脚本 (`auto-fix-navbar.js`)
- **功能**：监控关键配置文件，一旦被修改立即自动修复
- **监控的文件**：
  - `frontend/src/components/Navbar.vue` - 确保知识库导航项存在
  - `frontend/src/router/index.ts` - 确保知识库路由和守卫存在
  - `frontend/vite.config.ts` - 确保API代理配置存在

### 2. 一键修复脚本 (`fix-configs.bat`)
- **功能**：手动运行，一次性修复所有配置文件
- **使用方法**：双击运行 `fix-configs.bat`

### 3. 实时监控脚本 (`monitor-configs.bat`)
- **功能**：持续监控配置文件，发现修改立即修复
- **使用方法**：双击运行 `monitor-configs.bat`

## 当前状态 ✅

所有关键配置已修复并受到保护：

1. **导航栏配置** - 包含知识库和AI幻灯片模块
2. **路由配置** - 包含 `/knowledge` 和 `/knowledge-slides` 路由
3. **Vite配置** - 包含API代理设置
4. **语言配置** - 包含翻译键

## 如何使用

### 方案1：自动保护（推荐）
```bash
# 在项目根目录运行
node auto-fix-navbar.js
```
脚本会在后台持续运行，自动修复任何配置更改。

### 方案2：手动修复
如果导航栏模块消失：
1. 双击运行 `fix-configs.bat`
2. 或运行：`node auto-fix-navbar.js`

### 方案3：持续监控
如果需要持续监控：
1. 双击运行 `monitor-configs.bat`
2. 脚本会持续运行，按 Ctrl+C 停止

## 技术细节

### 导航栏修复
确保包含以下导航项：
```javascript
{
    label: t('nav.knowledge-base'),
    icon: 'pi pi-database',
    visible: () => authStore.user !== null,
    command: () => router.push('/knowledge')
},
{
    label: t('nav.ai-slides'),
    icon: 'pi pi-sparkles',
    visible: () => authStore.user !== null,
    command: () => router.push('/knowledge-slides')
}
```

### 路由修复
确保包含以下路由：
```javascript
{
    path: '/knowledge',
    name: 'knowledge',
    component: () => import('@/views/knowledge/KnowledgeManager.vue'),
    meta: { requiresAuth: true }
},
{
    path: '/knowledge-slides',
    name: 'knowledge-slides',
    component: () => import('@/views/knowledge-slides/KnowledgeSlidevManager.vue'),
    meta: { requiresAuth: true }
}
```

### Vite配置修复
确保包含API代理：
```javascript
proxy: {
    '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
    },
    '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
    }
}
```

## 注意事项

1. **脚本冲突**：如果运行多个监控脚本，可能会相互冲突
2. **性能影响**：文件监控会轻微增加CPU使用率
3. **Git操作**：提交代码时可能需要暂时停止监控脚本

## 故障排除

如果模块仍然消失：
1. 检查是否有其他进程在修改文件
2. 查看Git是否有自动还原的hooks
3. 检查IDE是否有自动格式化设置
4. 确保所有相关文件都已保存

## 长期解决方案

考虑：
1. 将配置更改提交到Git仓库
2. 在CI/CD流程中添加配置验证
3. 使用环境变量或配置文件管理重要设置
4. 建立代码审查流程，确保配置不被误删