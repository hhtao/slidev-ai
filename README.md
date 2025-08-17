<div align="center">


<img src="frontend/src/assets/icons/slidev-ai.svg" height="200px" />

<a href="https://github.com/LSTM-Kirigaya/slidev-ai"> <img src="https://img.shields.io/github/stars/LSTM-Kirigaya/slidev-ai?style=social" alt="GitHub Stars"></a><a href="https://opensource.org/licenses/MIT"> <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a><a href="https://kirigaya.cn/openmcp/"> <img src="https://img.shields.io/badge/OpenMCP_SDK-0.1.0-blue" alt="License"></a>

<h3>Slidev AI - AI-Powered Presentation Creation Platform</h3>

**Transform your ideas into stunning presentations with AI assistance**

</div>



## 🚀 Overview

Slidev-AI is a web app that leverages LLM (Large Language Model) technology to make creating Slidev-based online presentations elegant and effortless. It is designed to help engineers and academics quickly produce content-focused, minimalist PPTs that are easily shareable online.

> This project is also my submission for the [ModelScope MCP&Agent Competition](https://modelscope.cn/active/aihackathon-mcp-agent).

slidev-ai is a downstream implementation within the [OpenMCP](https://github.com/LSTM-Kirigaya/openmcp-client) ecosystem, demonstrating how developers can build specialized agents using OpenMCP's powerful framework. This project serves as:

- A reference implementation for OpenMCP agent development
- A production-ready presentation generation solution
- A template for creating domain-specific AI agents

🔗 [OpenMCP Document](https://kirigaya.cn/openmcp/)

## 💡 AI-Powered Project Generation Prompt

For developers looking to create similar AI-powered applications, here's a comprehensive prompt you can use with LLM to generate a similar website project:

```
我现在需要开发一个名为 slidev-ai 的前后端项目，请帮我完成基础的项目初始化。

## 技术选型

### 前端
typescript + vue3 + primevue + tailwindcss

### 后端
typescript + nestjs + sqlite + TypeORM

## 开源协议
MIT

## 架构

使用 turbo2 作为 build 和 dev 命令的构建脚本系统，基于根目录的 workspace 配置前后端项目的命令入口。后端文件夹为 backend，前端文件夹为 frontend 。

前端的开发服务器启动在 3000，后端的服务器启动在 3001。后端所有路由的接入点统一挂载到 /api 下，方便真实部署到服务器后 nginx 反向代理的配置。

后端采用 .env 配置整个后端的环境变量，请完成对应的文件创建，config 模块的配置和相应的环境变量的说明文档（请在 backend/README.md 中不暴露隐私的情况下说明 .env 的配置方法）。

### 鉴权

鉴权利用 jwt 进行鉴权，jwt 的更新和保存放在 Cookie 中实现，前端默认使用 axios 进行全部的请求，axios 将凭证需求全局设置为需要，保证每次的请求都会携带浏览器的 Cookie 信息；Cookie 的操作完全由后端来完成，通过 express 的 Response API 完成 Set-Cookie 响应头的设置，从而完成对 Cookie 的管理。你需要基于此实现，对应的登录，注册，登出的 API。

jwt 存储在 Cookie 的 jwt 字段，你需要完成解析请求体 Cookie 的 jwt 字段并进行用户身份鉴定的策略组，并覆盖 nestjs 原生的 jwt 鉴权策略。

### OSS

OSS 内联进入后端中，使用 ServeStaticModule 将全部访问 /api/uploads/*path 的请求映射到 OSS 的 backend/uploads/*path 中，暂时不需要进行鉴权。

## 基础功能需求

### 用户 user
用户的 CURD 和 登录，注册，登出。

### slide
你需要先根据下面的描述设计 slidev 的数据库实体模型，然后根据模型创建数据库表，并完成 CRUD 操作。数据实体需要通过 TypeORM 进行映射。

slide 是一种特殊的 ppt，目前用户的输入为 title，content 和 files，files 只需要注册文件拦截器后，保存它在服务器的绝对路径即可。

创建 slide 分为三个阶段：

1. input: 用户输入素材（数据库模型的 title, content, files 被更新）
2. outline: 根据 slidev-mcp 创建对应的大纲。
3. markdown: 根据 slidev-mcp 生成最终的 slidev markdown，此时前端会出现按钮，让用户选择预览、重新生成还是部署。
```

## Getting Started

### System Requirements
- Node.js v18+
- Python 3.10+
- npm 9+ or yarn 1.22+
- 4GB RAM minimum (8GB recommended for development)

### Quick Installation

```
# TODO
npx -c ...
```

### Development

```bash
git clone https://github.com/yourorg/slidev-ai.git
cd slidev-ai
npm i
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contribution Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for details.

## 📜 License

Slidev AI is open-source software licensed under the **MIT License** with additional terms for commercial use. See [LICENSE](LICENSE) for full details.

## 🌍 Community & Support

If you seek for tech support and deeper understanding of Slidev AI, please join our OpenMCP qq group:

<div align="center"> <a href="https://qm.qq.com/cgi-bin/qm/qr?k=C6ZUTZvfqWoI12lWe7L93cWa1hUsuVT0&jump_from=webapi&authKey=McW6B1ogTPjPDrCyGttS890tMZGQ1KB3QLuG4aqVNRaYp4vlTSgf2c6dMcNjMuBD" target="_blank" > <img src="https://img.icons8.com/color/24/000000/qq.png" style="vertical-align: middle; margin-right: 8px;" alt="QQ"> OpenMCP Developer Group </a> </div>

---

*"From concept to presentation in minutes"* - The Slidev AI Team