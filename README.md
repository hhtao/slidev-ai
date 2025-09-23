<div align="center">


<img src="frontend/src/assets/icons/slidev-ai.svg" height="200px" />

<a href="https://github.com/hhtao/slidev-ai"> <img src="https://img.shields.io/github/stars/hhtao/slidev-ai?style=social" alt="GitHub Stars"></a><a href="https://opensource.org/licenses/MIT"> <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a><a href="https://kirigaya.cn/openmcp/"> <img src="https://img.shields.io/badge/OpenMCP_SDK-0.1.0-blue" alt="License"></a>

<h3>Slidev AI - AI-Powered Presentation Creation Platform with Knowledge Base</h3>

*From ideas to presentations to content distribution — enhanced with intelligent knowledge base capabilities.*

> **Fork Notice**: This project is forked from [LSTM-Kirigaya/slidev-ai](https://github.com/LSTM-Kirigaya/slidev-ai) and enhanced with comprehensive local knowledge base functionality.

English | [中文](README.zh.md) | [Video](https://www.bilibili.com/video/BV1SMhBzJEUL)

</div>


## 🚀 Overview

Slidev-AI is an enhanced web application that leverages LLM (Large Language Model) technology combined with a powerful local knowledge base to make creating Slidev-based online presentations elegant and effortless. Building upon the original slidev-ai project, this fork adds comprehensive knowledge management capabilities, allowing users to upload, organize, and leverage their own documents for intelligent presentation generation.

### 🆕 Enhanced Features

This fork extends the original project with:

- **📚 Local Knowledge Base**: Upload and manage PDF, Markdown, Word documents, and text files
- **🔍 Smart Document Processing**: Automatic content extraction, parsing, and vectorization
- **🧠 Semantic Search**: AI-powered document search and retrieval
- **🎯 Knowledge-Driven Generation**: Create presentations based on your specific knowledge corpus
- **🔄 Four-Stage Generation Flow**: Streamlined workflow from configuration to final presentation
- **👥 User Management**: Role-based access control for document and presentation management

> **Original Project**: This project is based on the excellent work by [LSTM-Kirigaya](https://github.com/LSTM-Kirigaya) for the [ModelScope MCP&Agent Competition](https://modelscope.cn/active/aihackathon-mcp-agent).

This enhanced version maintains compatibility with the [OpenMCP](https://github.com/LSTM-Kirigaya/openmcp-client) ecosystem while adding enterprise-ready knowledge management capabilities. This project serves as:

- A comprehensive knowledge-base-driven presentation platform
- A reference implementation for document-aware AI applications  
- A production-ready solution for organizations managing large knowledge repositories
- An extended template for creating domain-specific AI agents with document intelligence



Check out the full demo on Bilibili: 


<a href="https://www.bilibili.com/video/BV1SMhBzJEUL/?spm_id_from=333.1387.homepage.video_card.click&vd_source=3f248073d6ebdb61308992901b606f24" target="_blank"><img src="https://pica.zhimg.com/80/v2-3674ccdc2ceef8255724dbf078cf6ee7_1440w.png" /></a>

🔗 [OpenMCP Document](https://kirigaya.cn/openmcp/)

## 💡 AI-Powered Project Generation Prompt

For developers looking to create similar AI-powered applications, here's a comprehensive prompt you can use with LLM to generate a similar website project:

[PROMPT.md](docs/PROMPT.md)

## ✨ Key Features

### 📖 Knowledge Base Management
- **Multi-format Support**: PDF, Markdown (.md), Word (.docx, .doc), and plain text files
- **Intelligent Processing**: Automatic content extraction and metadata generation
- **Vector Storage**: Advanced semantic search capabilities with vector embeddings
- **Permission Control**: Public and private document visibility settings
- **Batch Operations**: Upload multiple documents and manage them efficiently

### 🎨 Enhanced Presentation Generation
- **AI-Powered Outlines**: Generate presentation structures based on knowledge base content
- **Contextual Content**: Leverage retrieved documents for accurate, relevant presentations
- **Four-Stage Workflow**: Configuration → Outline → Content → Preview/Export
- **Template Flexibility**: Multiple themes and customization options
- **Export Options**: Download as Slidev projects, preview online, or publish publicly

### 🔧 Technical Architecture
- **Backend**: NestJS with TypeScript, SQLite database, vector storage
- **Frontend**: Vue 3 with Vite, modern responsive UI
- **AI Integration**: OpenAI/DeepSeek API with intelligent fallback mechanisms
- **Document Processing**: Advanced parsing engines for various file formats
- **Deployment**: Docker support, easy scaling options

## Getting Started

Please refer to [Quick Start](docs/quickstart.md) for the basic setup, and [Knowledge Module Documentation](docs/KNOWLEDGE_MODULE.md) for detailed information about the knowledge base features.

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contribution Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for details.

## 📜 License

Slidev AI is open-source software licensed under the **MIT License** with additional terms for commercial use. See [LICENSE](LICENSE) for full details.

## 🌍 Community & Support

If you seek for tech support and deeper understanding of Slidev AI, please join our OpenMCP qq group:

<div align="center"> <a href="https://qm.qq.com/cgi-bin/qm/qr?k=C6ZUTZvfqWoI12lWe7L93cWa1hUsuVT0&jump_from=webapi&authKey=McW6B1ogTPjPDrCyGttS890tMZGQ1KB3QLuG4aqVNRaYp4vlTSgf2c6dMcNjMuBD" target="_blank" > <img src="https://img.icons8.com/color/24/000000/qq.png" style="vertical-align: middle; margin-right: 8px;" alt="QQ"> OpenMCP Developer Group </a> </div>

---

*"From ideas to presentations to content distribution — enhanced with intelligent knowledge base capabilities to shorten the distance between your knowledge and compelling presentations."* - Enhanced by hhtao

## 🙏 Acknowledgments

This project is built upon the excellent foundation provided by [LSTM-Kirigaya/slidev-ai](https://github.com/LSTM-Kirigaya/slidev-ai). Special thanks to the original author for creating such a well-architected and extensible platform.

## 📊 Project Statistics

- **Original Project**: [LSTM-Kirigaya/slidev-ai](https://github.com/LSTM-Kirigaya/slidev-ai)
- **Enhanced by**: [hhtao](https://github.com/hhtao)
- **Key Enhancement**: Comprehensive Local Knowledge Base Integration
- **Additional LOC**: 10,000+ lines of new knowledge management functionality