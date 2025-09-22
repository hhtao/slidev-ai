# Dify 集成 Slidev-AI MCP 服务方案

## 当前状态
- MCP 服务已正常运行：`🚀 [slidev-mcp-academic] 1.12.3 connected`
- 后端服务运行在：`http://localhost:3001`
- 新增专用 Dify 接口（无需认证）：已完成 ✅
- 可用的 MCP 工具包括：
  - `usermcp_query_user_profile`
  - `slidev_save_outline`
  - `slidev_create`
  - `slidev_make_cover`
  - `slidev_add_page`
  - `slidev_export_project`

## 🎯 推荐方案：使用专用 Dify 接口（无需认证）

### 1. 创建并生成完整 PPT

**接口地址**：
```http
POST http://localhost:3001/api/mcp/dify/create-presentation
Content-Type: application/json

{
  "title": "人工智能发展趋势",
  "content": "介绍人工智能的发展历程、现状和未来趋势，包括机器学习、深度学习等关键技术",
  "theme": "academic",
  "visibility": "public",
  "generateContent": true
}
```

**响应示例**：
```json
{
  "success": true,
  "slideId": 123,
  "title": "人工智能发展趋势",
  "status": "pending",
  "previewUrl": "http://localhost:3001/api/presentation/123",
  "message": "PPT 创建成功，正在生成内容..."
}
```

### 2. 查询 PPT 创建状态

**接口地址**：
```http
GET http://localhost:3001/api/mcp/dify/presentation/{id}/status
```

**响应示例**：
```json
{
  "success": true,
  "slideId": 123,
  "title": "人工智能发展趋势",
  "status": "completed",
  "theme": "academic",
  "visibility": "public",
  "previewUrl": "http://localhost:3001/api/presentation/123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:05:00.000Z",
  "hasOutlines": true,
  "hasContent": true,
  "hasCover": true
}
```

### 3. PPT 状态说明

| 状态 | 说明 |
|------|------|
| `pending` | 刚创建，等待处理 |
| `generating-outline` | 正在生成大纲 |
| `outline-saved` | 大纲生成完成 |
| `generating-content` | 正在生成内容 |
| `markdown-saved` | 内容生成完成 |
| `completed` | 全部完成（包含封面） |
| `error` | 生成失败 |

## 🔧 Dify 集成步骤

### 第一步：在 Dify 中创建自定义工具

1. **创建 PPT 工具**：

```python
import requests
import json
import time

def create_presentation(title: str, content: str, theme: str = "academic", visibility: str = "public"):
    """
    创建新的演示文稿
    
    Args:
        title: PPT 标题
        content: PPT 内容描述
        theme: 主题 (academic, default, frankfurt, penguin, vuetiful)
        visibility: 可见性 (public, private)
    
    Returns:
        dict: 创建结果
    """
    url = "http://localhost:3001/api/mcp/dify/create-presentation"
    data = {
        "title": title,
        "content": content,
        "theme": theme,
        "visibility": visibility,
        "generateContent": True
    }
    
    try:
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": str(e),
            "message": "请求失败"
        }

def check_presentation_status(slide_id: int, max_wait_time: int = 300):
    """
    检查演示文稿状态，等待完成
    
    Args:
        slide_id: PPT ID
        max_wait_time: 最大等待时间（秒）
    
    Returns:
        dict: 状态信息
    """
    url = f"http://localhost:3001/api/mcp/dify/presentation/{slide_id}/status"
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            result = response.json()
            
            if result.get("success"):
                status = result.get("status")
                if status in ["completed", "error"]:
                    return result
                    
            # 等待 5 秒后重试
            time.sleep(5)
            
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": str(e),
                "message": "状态查询失败"
            }
    
    return {
        "success": False,
        "error": "timeout",
        "message": "等待超时"
    }

def create_and_wait_presentation(title: str, content: str, theme: str = "academic", visibility: str = "public", max_wait_time: int = 300):
    """
    创建 PPT 并等待完成
    
    Args:
        title: PPT 标题
        content: PPT 内容描述
        theme: 主题
        visibility: 可见性
        max_wait_time: 最大等待时间（秒）
    
    Returns:
        dict: 最终结果
    """
    # 创建 PPT
    create_result = create_presentation(title, content, theme, visibility)
    
    if not create_result.get("success"):
        return create_result
    
    slide_id = create_result.get("slideId")
    if not slide_id:
        return {
            "success": False,
            "error": "no_slide_id",
            "message": "创建成功但未获取到 PPT ID"
        }
    
    # 等待完成
    final_result = check_presentation_status(slide_id, max_wait_time)
    
    # 合并创建和状态信息
    if final_result.get("success"):
        final_result["createResult"] = create_result
        
    return final_result
```

### 第二步：配置 Dify 工作流

1. **创建新的工作流**
2. **添加用户输入节点**：
   - `title`（文本）：PPT 标题
   - `content`（长文本）：PPT 内容描述
   - `theme`（下拉选择）：academic, default, frankfurt, penguin, vuetiful

3. **添加自定义工具节点**：调用 `create_and_wait_presentation` 函数

4. **添加输出节点**：显示结果和预览链接

### 第三步：测试调用

**使用 curl 测试**：
```bash
# 创建 PPT
curl -X POST "http://localhost:3001/api/mcp/dify/create-presentation" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试演示文稿",
    "content": "这是一个测试演示文稿的内容描述，包含人工智能相关内容",
    "theme": "academic",
    "visibility": "public",
    "generateContent": true
  }'

# 查询状态（使用返回的 slideId）
curl -X GET "http://localhost:3001/api/mcp/dify/presentation/123/status"
```

**使用 Python 测试**：
```python
# 完整流程测试
result = create_and_wait_presentation(
    title="AI 技术发展趋势",
    content="详细介绍人工智能技术的发展历程、现状分析以及未来发展趋势预测",
    theme="academic",
    max_wait_time=600  # 等待 10 分钟
)

if result.get("success"):
    print(f"PPT 创建成功！")
    print(f"预览链接: {result.get('previewUrl')}")
    print(f"状态: {result.get('status')}")
else:
    print(f"创建失败: {result.get('message')}")
```

## 🌐 访问地址和端口

- **前端界面**：http://localhost:3000
- **后端 API**：http://localhost:3001/api
- **Swagger 文档**：http://localhost:3001/docs
- **Dify 专用接口**：http://localhost:3001/api/mcp/dify/*
- **演示文稿预览**：http://localhost:3001/api/presentation/{slide_id}

## ⚙️ 配置信息

### MCP 服务配置
- **配置文件路径**：`E:\slidev-ai\backend\openmcp\slide-{id}.json`
- **MCP 服务命令**：`uv run mcp run server.py`
- **工作目录**：`E:\slidev-ai\backend\slidev-mcp\servers\themes\academic`

### 环境变量
```bash
SLIDEV_MCP_ROOT=E:\slidev-ai\backend\markdown-files
OPENAI_API_KEY=sk-24774b4b2501404288d5fa9a7e289204
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat
PYTHONIOENCODING=utf-8
PYTHONUTTF8=1
```

## 📋 接口对比

### 原有接口（需要认证）
- `POST /api/slides/create` - 需要 JWT 认证
- `GET /api/slides/process/make-outline/{id}` - 需要认证
- `GET /api/slides/process/make-markdown/{id}` - 需要认证

### 新增 Dify 专用接口（无需认证）
- `POST /api/mcp/dify/create-presentation` - ✅ 无需认证
- `GET /api/mcp/dify/presentation/{id}/status` - ✅ 无需认证
- `GET /api/mcp/tools` - ✅ 获取 MCP 工具列表

## 🚀 优势特性

1. **无需认证**：专为 Dify 设计，简化调用流程
2. **一站式创建**：单个接口完成创建+生成全流程
3. **异步处理**：支持长时间的 AI 生成任务
4. **状态追踪**：实时查询生成进度
5. **错误处理**：完善的错误信息和重试机制
6. **多主题支持**：支持 5 种不同的演示文稿主题
7. **灵活配置**：可选择是否自动生成内容

## 🔄 下一步优化计划

1. ✅ 创建专门的 Dify 集成 API 接口
2. 🔄 添加批量处理功能
3. 🔄 支持自定义模板
4. 🔄 添加更多错误处理和重试机制
5. 🔄 支持 Webhook 回调通知
6. 🔄 添加 PPT 内容编辑接口
7. 🔄 支持导出多种格式（PDF、PPTX）