# 知识库模块保护指南

## 🚨 重要警告

**知识库模块是 Slidev-AI 项目的核心功能，任何修改都必须极其谨慎！**

这是第 **5 次** 因为知识库模块被意外删除而导致功能失效的问题。

## 📋 核心保护规则

### ❌ 绝对禁止的操作

1. **删除或移动知识库相关文件**
   - `backend/src/app/knowledge/` 目录下的任何文件
   - `frontend/src/views/dashboard/KnowledgeManager.vue`
   - `frontend/src/views/dashboard/KnowledgeBasedSlideGenerator.vue`

2. **修改 AppModule 配置**
   - 禁止从 `backend/src/app.module.ts` 中移除 `KnowledgeModule`
   - 任何对 AppModule 的修改都必须保留知识库模块导入

3. **破坏 API 路由**
   - 禁止修改 `/api/knowledge/*` 路由
   - 禁止修改 `/api/knowledge-slides/*` 路由

### ✅ 必须遵守的流程

1. **修改前检查**
   ```bash
   npm run check-knowledge
   ```

2. **修改后验证**
   ```bash
   # 检查模块完整性
   npm run check-knowledge
   
   # 测试API是否正常
   curl http://localhost:3001/api/knowledge/test
   
   # 测试前端页面是否可访问
   # 访问 http://localhost:3000/knowledge
   # 访问 http://localhost:3000/knowledge-slides
   ```

3. **提交前自动检查**
   - Git 钩子会在每次提交前自动运行检查
   - 如果检查失败，提交会被阻止

## 🛠️ 快速修复命令

如果知识库模块出现问题，使用以下命令快速诊断：

```bash
# 运行完整性检查
npm run check-knowledge

# 手动检查后端模块
grep -n "KnowledgeModule" backend/src/app.module.ts

# 手动检查前端路由
grep -n "knowledge" frontend/src/router/index.ts

# 手动检查导航菜单
grep -n "knowledge-manager" frontend/src/components/Navbar.vue
```

## 🔧 常见问题修复

### 问题1：找不到 KnowledgeBasedSlideGenerator.vue

**错误**: `Failed to resolve import "@/views/knowledge/KnowledgeBasedSlideGenerator.vue"`

**原因**: 路由配置的文件路径错误

**修复**: 
```typescript
// 错误路径
component: () => import('@/views/knowledge/KnowledgeBasedSlideGenerator.vue')

// 正确路径  
component: () => import('@/views/dashboard/KnowledgeBasedSlideGenerator.vue')
```

### 问题2：菜单按钮不显示

**原因**: 缺少翻译键或导航配置

**修复**: 
1. 检查 `frontend/src/i18n/locales/bundle.l10n.zh.json` 中是否包含:
   - `"nav.knowledge-manager": "知识库管理"`
   - `"nav.smart-generation": "智能生成"`

2. 检查 `frontend/src/components/Navbar.vue` 中是否包含菜单项配置

### 问题3：后端API不响应

**原因**: KnowledgeModule 未导入到 AppModule

**修复**:
```typescript
// backend/src/app.module.ts
import { KnowledgeModule } from './app/knowledge/knowledge.module';

@Module({
  imports: [
    // ... 其他模块
    KnowledgeModule,  // 确保这行存在
    // ... 其他模块
  ],
})
```

## 📞 紧急联系

如果遇到无法解决的知识库模块问题：

1. 立即停止所有修改操作
2. 运行 `npm run check-knowledge` 获取详细错误信息
3. 根据检查结果进行针对性修复
4. 修复后重新运行检查确认

## 🎯 项目目标提醒

**本次项目改版的主要目的就是为了修订和完善知识库模块！**

知识库模块 = 项目核心价值 = 绝对不能删除

任何可能影响知识库模块的操作都需要：
- 充分的事前评估
- 完整的备份
- 全面的测试验证