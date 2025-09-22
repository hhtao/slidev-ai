# 知识库模块文档

## 概述

知识库模块是Slidev-AI项目的核心功能组件，提供文档上传、解析、向量化存储和基于知识库的智能幻灯片生成功能。

## 🚨 重要声明

**知识库模块是本项目的核心功能，任何修改都必须确保该模块的完整性。本项目的改版主要目的就是为了修订和完善知识库模块。**

## 功能特性

### 核心功能
1. **文档管理**: 支持PDF、Markdown、Word文档的上传和管理
2. **智能解析**: 自动提取文档内容和元数据
3. **向量化存储**: 将文档内容转换为向量形式存储
4. **语义搜索**: 基于向量相似度的智能搜索
5. **智能生成**: 基于知识库内容生成幻灯片大纲和内容
6. **权限控制**: 支持公开和私有文档权限管理

### 支持的文件格式
- PDF文档 (`.pdf`)
- Markdown文件 (`.md`)
- Word文档 (`.docx`, `.doc`)
- 纯文本文件 (`.txt`)

## 技术架构

### 后端架构 (backend/src/app/knowledge/)

#### 控制器层
- **KnowledgeController**: 知识库CRUD API
- **KnowledgeBasedSlideController**: 基于知识库的幻灯片生成API

#### 服务层
- **KnowledgeService**: 核心业务逻辑
- **DocumentProcessingService**: 文档处理服务
- **VectorService**: 向量处理服务
- **VectorDbService**: 向量数据库服务
- **EnhancedRAGService**: 检索增强生成服务
- **SmartRecommendationService**: 智能推荐服务

#### 数据层
- **Knowledge**: 实体定义
- **KnowledgeRepository**: 数据访问层

#### 模块配置
- **KnowledgeModule**: 模块配置和依赖注入

### 前端架构 (frontend/src/views/dashboard/)

#### 主要组件
- **KnowledgeManager.vue**: 知识库管理界面
- **KnowledgeBasedSlideGenerator.vue**: 基于知识库的幻灯片生成界面

#### API封装
- **knowledgeApi**: 知识库API调用封装
- **knowledgeBasedSlideApi**: 幻灯片生成API封装

## API接口

### 知识库管理API

#### 基础CRUD操作
```http
# 获取知识库列表
GET /api/knowledge
Parameters: page, limit, keyword, contentType, visibility

# 创建知识文档
POST /api/knowledge
Body: { title, content, summary, contentType, visibility, metadata }

# 获取单个文档详情
GET /api/knowledge/:id

# 更新文档
PATCH /api/knowledge/:id
Body: { title, content, summary, visibility, metadata }

# 删除文档
DELETE /api/knowledge/:id
```

#### 文件操作
```http
# 文档上传
POST /api/knowledge/upload
Content-Type: multipart/form-data
Body: file (支持PDF、Markdown、Word等格式)

# 语义搜索
GET /api/knowledge/search
Parameters: query, limit, threshold
```

### 基于知识库的幻灯片生成API

```http
# 生成幻灯片大纲
POST /api/knowledge-slides/generate-outline
Body: { title, topic, requirements, targetAudience, slideCount, theme }

# 预览相关内容
POST /api/knowledge-slides/preview-content
Body: { query }

# 获取知识库统计
GET /api/knowledge-slides/knowledge-stats
```

## 数据库设计

### Knowledge表结构
```sql
CREATE TABLE knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    summary TEXT,
    contentType VARCHAR(50),
    visibility VARCHAR(20) DEFAULT 'public',
    filename VARCHAR(255),
    filePath VARCHAR(500),
    fileSize INTEGER,
    metadata JSON,
    vectorStatus VARCHAR(50),
    userId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL
);
```

## 使用指南

### 管理员操作

#### 1. 访问知识库管理
- 登录系统后，从仪表板进入知识库管理
- 只有管理员用户可以访问完整的知识库管理功能

#### 2. 上传文档
1. 点击"上传文档"按钮
2. 选择支持的文件格式
3. 系统自动解析文档内容
4. 设置文档的可见性（公开/私有）

#### 3. 管理文档
- 查看：点击文档行查看详细内容
- 编辑：修改文档标题、摘要等信息
- 删除：删除不需要的文档
- 搜索：使用关键词搜索文档

#### 4. 基于知识库生成幻灯片
1. 进入"智能生成"页面
2. 输入幻灯片主题和要求
3. 系统基于知识库内容生成大纲
4. 预览并调整生成的内容
5. 创建最终的幻灯片

### 普通用户操作
- 查看公开的知识文档
- 使用基于知识库的幻灯片生成功能

## 开发指南

### 环境配置

#### 后端依赖
```bash
npm install multer uuid @types/multer
```

#### 文件上传配置
- 最大文件大小: 10MB
- 存储路径: `./uploads/knowledge/`
- 支持的MIME类型: 
  - `text/plain`
  - `text/markdown`
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 开发注意事项

#### 1. 模块导入
确保KnowledgeModule在AppModule中正确导入：
```typescript
@Module({
    imports: [
        // ... 其他模块
        KnowledgeModule,  // 必须包含
        // ... 其他模块
    ],
})
export class AppModule { }
```

#### 2. 路由配置
知识库相关路由必须正确映射：
- `/api/knowledge/*` - 知识库管理API
- `/api/knowledge-slides/*` - 基于知识库的幻灯片生成API

#### 3. 权限控制
- 管理员：完整的CRUD权限
- 普通用户：只能查看公开文档

#### 4. 错误处理
- 文件上传失败处理
- 文档解析错误处理
- 向量化处理异常处理

### 测试验证

#### 功能测试检查清单
- [ ] 文档上传功能正常
- [ ] 文档解析正确
- [ ] 文档列表加载正常
- [ ] 搜索功能工作
- [ ] 文档编辑功能正常
- [ ] 文档删除功能正常
- [ ] 基于知识库的幻灯片生成正常
- [ ] 权限控制正确

#### API测试
```bash
# 测试知识库模块是否正常加载
curl http://localhost:3001/api/knowledge/test

# 测试文档上传
curl -X POST http://localhost:3001/api/knowledge/upload \
  -F "file=@test.pdf"

# 测试搜索功能
curl "http://localhost:3001/api/knowledge/search?query=测试"
```

## 故障排除

### 常见问题

#### 1. KnowledgeModule未加载
**症状**: API返回404错误
**解决**: 检查AppModule.imports数组，确保包含KnowledgeModule

#### 2. 文件上传失败
**症状**: 上传文件时返回错误
**解决**: 
- 检查文件格式是否支持
- 检查文件大小是否超限
- 检查uploads目录权限

#### 3. 向量化处理失败
**症状**: 文档上传成功但搜索无结果
**解决**: 检查向量数据库连接和配置

#### 4. 前端页面无法访问
**症状**: 知识库管理页面无法加载
**解决**: 
- 检查路由配置
- 检查用户权限
- 检查前端组件是否正确导入

### 错误日志分析
查看后端日志中的错误信息：
```bash
# 查看NestJS应用日志
npm run start:dev
```

## 性能优化

### 建议的优化措施
1. **文件存储优化**: 使用CDN或对象存储
2. **向量搜索优化**: 实现搜索结果缓存
3. **大文档处理**: 异步处理和进度提示
4. **数据库优化**: 添加适当的索引

## 安全考虑

### 安全措施
1. **文件类型验证**: 严格验证上传文件类型
2. **文件大小限制**: 防止大文件攻击
3. **内容过滤**: 过滤恶意内容
4. **权限控制**: 确保用户只能访问授权的文档

## 更新历史

- **v1.0.0**: 初始版本，基础文档管理功能
- **v1.1.0**: 添加向量化搜索功能
- **v1.2.0**: 添加基于知识库的幻灯片生成功能
- **v1.3.0**: 优化文档解析和用户界面

---

**重要提醒**: 知识库模块是本项目的核心功能，任何修改都必须经过充分测试，确保功能的完整性和稳定性。