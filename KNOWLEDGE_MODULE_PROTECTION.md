# 知识库模块保护文档

## ⚠️ 重要警告

**知识库模块已经第10次意外丢失！** 这表明存在系统性问题需要特别注意。

## 🛡️ 保护机制

为了防止知识库模块再次丢失，我们建立了以下保护机制：

### 1. 自动检查脚本
```bash
# 检查知识库模块完整性
node scripts/check-knowledge-module.js
```

### 2. 自动修复脚本
```bash
# 自动修复知识库模块配置
node scripts/fix-knowledge-module.js
```

### 3. Git 钩子保护
- `.git/hooks/pre-commit` - 提交前自动检查
- 防止错误的提交导致知识库模块丢失

## 📋 关键文件清单

### 后端核心文件
- `backend/src/app.module.ts` - **必须包含 KnowledgeModule**
- `backend/src/app/knowledge/knowledge.module.ts`
- `backend/src/app/knowledge/knowledge.controller.ts`
- `backend/src/app/knowledge/knowledge.service.ts`
- `backend/src/app/knowledge/knowledge-based-slide.controller.ts`
- `backend/src/app/knowledge/knowledge-based-slide.service.ts`
- `backend/src/app/knowledge/knowledge-slidev.controller.ts`
- `backend/src/app/knowledge/knowledge-slidev.service.ts`

### 前端核心文件
- `frontend/src/router/index.ts` - 知识库路由
- `frontend/src/views/knowledge-slides/` - 知识库页面
- `frontend/src/api/knowledge-slidev.ts` - API接口

## 🔧 手动修复步骤

如果知识库模块再次丢失，请按以下步骤修复：

1. **检查 app.module.ts**
   ```typescript
   // 确保包含以下导入
   import { KnowledgeModule } from './app/knowledge/knowledge.module';
   
   // 确保在 imports 数组中注册
   @Module({
     imports: [
       // ... 其他模块
       SlidevMcpModule,
       KnowledgeModule,  // 绝对不能删除！
       SlidesModule,
       // ... 其他模块
     ],
   })
   ```

2. **验证知识库文件完整性**
   ```bash
   ls -la backend/src/app/knowledge/
   ```

3. **重启服务验证**
   ```bash
   npm run dev
   ```

## 🚨 常见问题

### Q: 为什么知识库模块会丢失？
A: 可能原因包括：
- 文件编辑时意外删除导入语句
- 代码重构时遗漏模块注册
- Git操作时意外覆盖文件
- IDE自动格式化时删除"未使用"的导入

### Q: 如何预防再次丢失？
A: 
- 使用自动检查脚本
- 启用Git钩子
- 代码审查时特别关注app.module.ts
- 定期运行完整性检查

## 📞 联系支持

如果知识库模块再次丢失且自动修复失败，请：
1. 运行检查脚本获取详细错误信息
2. 检查Git提交历史
3. 参考此文档进行手动修复

---

**最后更新**: 2025/09/20 - 第10次知识库模块恢复
**下次检查**: 建议每日运行检查脚本