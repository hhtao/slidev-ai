# Security Policy

## ⚠️ Important Notice about Node.js 22

We have identified compatibility and stability issues when running **Slidev AI** on **Node.js 22**:

- Some dependencies may fail to build or install correctly.
- Unexpected runtime errors can occur during `npm install` or application startup.
- Long-term support (LTS) versions below Node.js 22 are recommended until these issues are resolved.

**✅ Recommended Node.js versions:**  
- Node.js 20.x (LTS)  
- Node.js 18.x (LTS, maintenance mode)  

**❌ Not Recommended:**  
- Node.js 22.x (known issues)  

---

## Supported Versions

We actively test and support the following environments:

| Node.js Version | Status        |
|-----------------|---------------|
| 22.x            | ⚠️ Not supported (unstable) |
| 20.x (LTS)      | ✅ Supported |
| 18.x (LTS)      | ✅ Supported |

---

## Reporting a Vulnerability

If you discover a **security vulnerability** in Slidev AI:

1. **Do not disclose publicly** until the issue has been addressed.  
2. Please open a [private security advisory on GitHub](https://github.com/LSTM-Kirigaya/slidev-ai/security/advisories) or contact the maintainer directly.  
3. Provide as much detail as possible (steps to reproduce, logs, affected environment).  

We take security issues seriously and will respond promptly.

---

## Best Practices for Users

- Always use a recommended Node.js LTS version.  
- Keep your dependencies updated with `npm audit` and `npm outdated`.  
- Use containerization (Docker) or virtual environments to isolate builds.  
- Avoid exposing your Slidev AI backend directly to the public Internet without proper authentication and TLS.  

---

Stay safe, and thank you for helping us keep **Slidev AI** secure!  
