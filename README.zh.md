<div align="center">

<img src="frontend/src/assets/icons/slidev-ai.svg" height="200px" />

<a href="https://github.com/hhtao/slidev-ai"> <img src="https://img.shields.io/github/stars/hhtao/slidev-ai?style=social" alt="GitHub Stars"></a><a href="https://opensource.org/licenses/MIT"> <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a><a href="https://kirigaya.cn/openmcp/"> <img src="https://img.shields.io/badge/OpenMCP_SDK-0.1.0-blue" alt="License"></a>

<h3>Slidev AI - AI 驱动的演示文稿生成平台（集成知识库）</h3>

*从想法到演示再到内容传播，结合智能知识库功能，让距离更短*

> **Fork 说明**: 本项目 Fork 自 [LSTM-Kirigaya/slidev-ai](https://github.com/LSTM-Kirigaya/slidev-ai)，并增强了全面的本地知识库功能。

[English](./README.md) | 中文 | [视频](https://www.bilibili.com/video/BV1SMhBzJEUL)


</div>

---

## 🚀 项目简介

Slidev-AI 是一个增强版的 Web 应用，结合了 LLM（大语言模型）技术和强大的本地知识库功能，让创建基于 Slidev 的在线演示文稿变得优雅而轻松。在原项目基础上，本 Fork 版本增加了全面的知识管理能力，允许用户上传、组织和利用自己的文档进行智能演示文稿生成。

### 🆕 增强功能

本 Fork 版本在原项目基础上新增：

- **📚 本地知识库**: 上传和管理 PDF、Markdown、Word 文档和文本文件
- **🔍 智能文档处理**: 自动内容提取、解析和向量化
- **🧠 语义搜索**: AI 驱动的文档搜索和检索
- **🎯 知识驱动生成**: 基于特定知识语料库创建演示文稿
- **🔄 四阶段生成流程**: 从配置到最终演示的流线化工作流
- **👥 用户管理**: 基于角色的文档和演示访问控制

> **原始项目**: 本项目基于 [LSTM-Kirigaya](https://github.com/LSTM-Kirigaya) 为 [ModelScope MCP&Agent Competition](https://modelscope.cn/active/aihackathon-mcp-agent) 创建的优秀作品。

本增强版本保持了与 [OpenMCP](https://github.com/LSTM-Kirigaya/openmcp-client) 生态的兼容性，同时添加了企业级的知识管理能力。该项目的定位包括：

- 综合性知识库驱动的演示文稿平台
- 文档感知 AI 应用的参考实现
- 大型知识库管理组织的生产就绪解决方案
- 具有文档智能的领域专用 AI Agent 扩展模板

请在B站上查看介绍视频： 

<a href="https://www.bilibili.com/video/BV1SMhBzJEUL/?spm_id_from=333.1387.homepage.video_card.click&vd_source=3f248073d6ebdb61308992901b606f24" target="_blank"><img src="https://pica.zhimg.com/80/v2-3674ccdc2ceef8255724dbf078cf6ee7_1440w.png" /></a>



🔗 [OpenMCP 文档](https://kirigaya.cn/openmcp/)

## 💡 AI 项目生成提示词

对于想要开发类似 AI 应用的开发者，这里提供了一个完整的 LLM Prompt，可用于生成类似的前后端项目：

[PROMPT.md](docs/PROMPT.md)

## ✨ 核心特性

### 📖 知识库管理
- **多格式支持**: PDF、Markdown (.md)、Word (.docx, .doc) 和纯文本文件
- **智能处理**: 自动内容提取和元数据生成
- **向量存储**: 支持向量嵌入的高级语义搜索功能
- **权限控制**: 公开和私有文档可见性设置
- **批量操作**: 上传多个文档并高效管理

### 🎨 增强的演示文稿生成
- **AI 驱动大纲**: 基于知识库内容生成演示结构
- **上下文内容**: 利用检索到的文档生成准确、相关的演示文稿
- **四阶段工作流**: 配置 → 大纲 → 内容 → 预览/导出
- **模板灵活性**: 多种主题和自定义选项
- **导出选项**: 下载为 Slidev 项目、在线预览或公开发布

### 🔧 技术架构
- **后端**: NestJS with TypeScript，SQLite 数据库，向量存储
- **前端**: Vue 3 with Vite，现代响应式 UI
- **AI 集成**: OpenAI/DeepSeek API，智能降级机制
- **文档处理**: 各种文件格式的高级解析引擎
- **部署**: Docker 支持，易于扩展选项

## 📦 快速开始

请参阅[快速开始](docs/quickstart_zh.md)获取基本设置，以及[知识库模块文档](docs/KNOWLEDGE_MODULE.md)了解知识库功能的详细信息。

## 🤝 贡献指南

欢迎社区贡献！请参考 [贡献指南](CONTRIBUTING.md) 和 [行为准则](CODE_OF_CONDUCT.md)。

## 📜 开源协议

Slidev AI 基于 **MIT License** 开源，并对商业用途附加条款。详情请见 [LICENSE](LICENSE)。

## 🌍 社区与支持

如果你希望获取更多技术支持或深入理解 Slidev AI，欢迎加入 OpenMCP QQ 群：

<div align="center"> <a href="https://qm.qq.com/cgi-bin/qm/qr?k=C6ZUTZvfqWoI12lWe7L93cWa1hUsuVT0&jump_from=webapi&authKey=McW6B1ogTPjPDrCyGttS890tMZGQ1KB3QLuG4aqVNRaYp4vlTSgf2c6dMcNjMuBD" target="_blank" > <img src="https://img.icons8.com/color/24/000000/qq.png" style="vertical-align: middle; margin-right: 8px;" alt="QQ"> OpenMCP 开发者交流群 </a> </div>

---

*"从想法到演示再到内容传播，结合智能知识库功能，让您的知识与精彩演示之间的距离更短"* - hhtao 增强版

## 🙏 致谢

本项目构建在 [LSTM-Kirigaya/slidev-ai](https://github.com/LSTM-Kirigaya/slidev-ai) 提供的优秀基础之上。特别感谢原作者创建了如此架构良好且可扩展的平台。

## 📊 项目统计

- **原始项目**: [LSTM-Kirigaya/slidev-ai](https://github.com/LSTM-Kirigaya/slidev-ai)
- **增强作者**: [hhtao](https://github.com/hhtao)
- **核心增强**: 全面的本地知识库集成
- **新增代码**: 10,000+ 行知识管理功能代码
