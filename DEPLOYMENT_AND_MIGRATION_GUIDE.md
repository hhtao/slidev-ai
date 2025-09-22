# 部署步骤总结和知识库PPT生成代码迁移指南

## 🚀 系统部署步骤

### 1. 环境准备

#### 系统要求
- Node.js v18+
- Python 3.10+
- npm 9+ 或 yarn 1.22+
- 至少 4GB 内存（推荐 8GB 开发环境）
- Windows 24H2（当前用户环境）

#### 依赖工具安装
```powershell
# 检查和安装Python (使用uv包管理器)
python --version
pip install uv

# 检查和安装Node.js
node --version
npm --version

# 全局安装Slidev CLI
npm install -g @slidev/cli

# 安装Playwright Chromium
cd backend/slidev-mcp
uv sync
uv run playwright install chromium
```

### 2. 项目初始化

#### 克隆和安装依赖
```powershell
git clone https://github.com/yourorg/slidev-ai.git
cd slidev-ai

# 安装工作区依赖（根/前端/后端）
npm install

# 进入Python子项目安装依赖
cd backend/slidev-mcp
uv sync
cd ../..
```

#### 环境变量配置
在`backend/.env`文件中配置：

```bash
# JWT密钥（生产环境必须更改）
JWT_SECRET=slidev-ai-jwt-secret-key

# 服务端口
PORT=3001

# MCP配置
SLIDEV_MCP_REPO=https://github.com/LSTM-Kirigaya/slidev-mcp
SLIDEV_MCP_PATH=slidev-mcp
SLIDEV_MCP_UPDATE_INTERVAL=3600000

# OpenAI配置（必填）
OPENAI_API_KEY=sk-xxxxxxxPLACEHOLDER
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat

# 管理员账户（生产环境必须更改）
ADMIN_USER=admin
ADMIN_PASSWORD=ChangeMe_123!

# 编码修复（Windows环境）
PYTHONIOENCODING=utf-8
LC_ALL=C.UTF-8
LANG=C.UTF-8
PYTHONUTF8=1
```

### 3. 启动服务

#### 开发环境启动
```powershell
# 启动完整开发服务（前端+后端）
npm run dev

# 单独启动前端（可选）
cd frontend
npm run dev

# 单独启动后端（可选）
cd backend
npm run dev
```

#### 访问地址
- 前端：http://localhost:3000
- 后端API：http://localhost:3001

### 4. 功能验证

#### 基础功能检查
- ✅ 用户注册/登录
- ✅ 知识库模块加载
- ✅ MCP服务器启动
- ✅ 前端后端通信

#### 管理员功能验证
- ✅ 用户管理（UserPanel）
- ✅ 邀请码管理
- ✅ 主题管理
- ✅ 知识库管理

## 📋 知识库PPT生成代码流程分析

### 当前知识库PPT生成流程

#### 1. 流程组件结构
```
frontend/src/views/knowledge-slides/
├── KnowledgeSlideProcess.vue          # 主流程控制器
├── KnowledgeStage1Config.vue          # 阶段1：配置生成
├── KnowledgeStage2Outline.vue         # 阶段2：生成大纲
├── KnowledgeStage3Markdown.vue        # 阶段3：生成内容
├── KnowledgeStage4Preview.vue         # 阶段4：预览导出
├── KnowledgeSlidevManager.vue         # 项目管理器
└── dto.ts                             # 类型定义
```

#### 2. 四阶段生成流程

**阶段1 - 配置生成**
- 选择知识库文档
- 配置主题和样式
- 设置基本参数
- 输出：`KnowledgeSlideRequest`

**阶段2 - 生成大纲**
- 基于知识库内容生成大纲
- 用户可编辑和调整大纲
- 调用后端API：`/api/knowledge-slides/generate-outline`
- 输出：`KnowledgeSlideOutline`

**阶段3 - 生成内容**
- 基于大纲生成详细Markdown内容
- 实时显示生成进度
- 调用后端API：`/api/knowledge-slides/generate-markdown`
- 输出：`KnowledgeSlidevProject`

**阶段4 - 预览导出**
- 预览生成的PPT
- 支持在线演示
- 导出多种格式（PDF, PPT, HTML）

#### 3. 后端API架构

**核心控制器**
```typescript
// backend/src/app/knowledge-slides/
├── knowledge-based-slide.controller.ts    # 知识库幻灯片控制器
├── knowledge-slidev.controller.ts         # Slidev项目控制器
└── services/
    ├── knowledge-based-slide.service.ts   # 业务逻辑服务
    └── knowledge-slidev.service.ts        # 项目管理服务
```

**关键API端点**
- `POST /api/knowledge-slides/generate-outline` - 生成大纲
- `POST /api/knowledge-slides/generate-markdown` - 生成内容
- `POST /api/knowledge-slides/create-project` - 创建项目
- `GET /api/knowledge-slides/project/:id/build` - 构建项目
- `GET /api/knowledge-slides/projects` - 获取项目列表

#### 4. MCP (模型能力插件) 集成

**MCP服务架构**
```
backend/slidev-mcp/
├── servers/
│   ├── core/
│   │   ├── base_server.py              # 基础服务器
│   │   ├── prompt_manager.py           # 提示词管理
│   │   └── common.py                   # 通用工具
│   └── themes/
│       ├── academic/                   # 学术主题
│       ├── default/                    # 默认主题
│       └── frankfurt/                  # 法兰克福主题
└── docs/                               # MCP文档
```

## 🔄 代码迁移到Admin管理功能

### 1. 创建Admin专用PPT生成组件

#### 组件结构设计
```
frontend/src/views/dashboard/admin/
├── AdminSlideGenerator.vue             # 管理员PPT生成入口
├── AdminSlideProcess.vue               # 管理员专用生成流程
├── AdminSlideTemplates.vue             # 模板管理
├── AdminSlideProjects.vue              # 项目管理
└── components/
    ├── AdminStageConfig.vue            # 管理员配置阶段
    ├── AdminStageOutline.vue           # 管理员大纲阶段
    ├── AdminStageMarkdown.vue          # 管理员内容阶段
    └── AdminStagePreview.vue           # 管理员预览阶段
```

#### 路由配置
```typescript
// frontend/src/router/index.ts
{
    path: '/admin/slides',
    name: 'admin-slides',
    component: () => import('@/views/dashboard/admin/AdminSlideGenerator.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
},
{
    path: '/admin/slides/process',
    name: 'admin-slide-process',
    component: () => import('@/views/dashboard/admin/AdminSlideProcess.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
}
```

### 2. 后端API扩展

#### 管理员专用API
```typescript
// backend/src/app/admin/admin-slides.controller.ts
@Controller('api/admin/slides')
export class AdminSlidesController {
    @Post('batch-generate')
    async batchGenerateSlides(@Body() request: BatchGenerateRequest) {
        // 批量生成PPT功能
    }
    
    @Get('templates')
    async getTemplates() {
        // 获取所有模板
    }
    
    @Post('templates')
    async createTemplate(@Body() template: SlideTemplate) {
        // 创建新模板
    }
    
    @Get('analytics')
    async getAnalytics() {
        // 获取生成统计
    }
}
```

### 3. 核心代码迁移步骤

#### 步骤1：复制基础组件
```powershell
# 复制知识库生成组件作为基础
cp frontend/src/views/knowledge-slides/KnowledgeSlideProcess.vue frontend/src/views/dashboard/admin/AdminSlideProcess.vue
cp frontend/src/views/knowledge-slides/dto.ts frontend/src/views/dashboard/admin/admin-dto.ts
```

#### 步骤2：修改权限和业务逻辑
```typescript
// AdminSlideProcess.vue 关键修改
<script setup lang="ts">
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();

// 验证管理员权限
const isAdmin = computed(() => authStore.user?.role === 'admin');

onMounted(() => {
    if (!isAdmin.value) {
        router.push('/dashboard');
        return;
    }
    // 其他初始化逻辑...
});
</script>
```

#### 步骤3：增强管理员功能
```typescript
// 管理员专用功能
interface AdminSlideFeatures {
    batchGeneration: boolean;      // 批量生成
    templateManagement: boolean;   // 模板管理
    userProjectAccess: boolean;    // 访问用户项目
    systemAnalytics: boolean;      // 系统统计
}
```

### 4. 数据库设计扩展

#### 管理员相关表结构
```sql
-- 管理员操作日志表
CREATE TABLE admin_operations (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    operation_type VARCHAR(50) NOT NULL,
    target_resource VARCHAR(100),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PPT模板表
CREATE TABLE slide_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. 迁移后的功能增强

#### 管理员专用功能
- **批量生成**：一次性为多个知识库生成PPT
- **模板管理**：创建、编辑、删除PPT模板
- **用户项目管理**：查看和管理所有用户的PPT项目
- **系统统计**：生成使用情况和性能统计报告
- **高级配置**：系统级别的生成参数配置

#### 权限控制
```typescript
// 管理员权限守卫
export const adminGuard: NavigationGuard = (to, from, next) => {
    const authStore = useAuthStore();
    
    if (authStore.user?.role !== 'admin') {
        next('/dashboard');
        return;
    }
    
    next();
};
```

## 🔧 部署后的维护和监控

### 1. 日志监控
- 后端服务日志：`backend/logs/`
- MCP服务日志：`backend/slidev-mcp/logs/`
- 前端错误监控：浏览器控制台

### 2. 性能监控
- API响应时间
- MCP连接状态
- 内存使用情况
- 生成任务队列状态

### 3. 备份策略
- 数据库定期备份
- 用户上传文件备份
- 配置文件版本控制

## 📚 参考资源

- [OpenMCP 文档](https://kirigaya.cn/openmcp/)
- [Slidev 官方文档](https://sli.dev/)
- [项目快速开始指南](docs/quickstart_zh.md)
- [编码错误修复报告](ENCODING_FIX_REPORT.md)

## 🎯 下一步计划

1. 完成管理员PPT生成功能的具体实现
2. 添加批量生成和模板管理功能
3. 实现系统监控和分析面板
4. 优化用户体验和性能
5. 添加更多自定义主题和模板