## Quick Start
### System Requirements
- Node.js v18+
- Python 3.10+
- npm 9+ or yarn 1.22+
- 4GB RAM minimum (8GB recommended for development)

### Environment Variables

Create a `.env` file inside the `backend` directory (never commit real secrets). For production, prefer a secure secret management solution (Vault, cloud environment injection, etc.).

| Name | Required | Example | Description |
| ---- | -------- | ------- | ----------- |
| JWT_SECRET | Yes | slidev-ai-jwt-secret-key | Symmetric key used to sign/verify JWT. Use a long random value in production. |
| PORT | No | 3001 | Backend service listening port. |
| SLIDEV_MCP_REPO | No | https://github.com/LSTM-Kirigaya/slidev-mcp | MCP (Model Capability Plugin) repository URL. Will be cloned if missing locally at startup. |
| SLIDEV_MCP_PATH | No | slidev-mcp | Local storage path for the MCP repo (relative to project root or absolute). |
| SLIDEV_MCP_UPDATE_INTERVAL | No | 3600000 | Auto update check interval for MCP in milliseconds (example is 1 hour). |
| OPENAI_API_KEY | Yes (when AI features enabled) | sk-xxxxxxxPLACEHOLDER | API key for an OpenAI-compatible endpoint. Use your own key; do NOT commit it. |
| OPENAI_BASE_URL | Yes | https://api.deepseek.com | Base URL of the OpenAI-compatible API (can point to self-hosted/proxy). |
| OPENAI_MODEL | Yes | deepseek-chat | Default model name; adjust as needed. |
| ADMIN_USER | No (default: admin) | admin | Admin username created at first startup. Change on first deployment. |
| ADMIN_PASSWORD | No (default: admin) | ChangeMe_123! | Plaintext admin password used only at initialization (hashed before storing). Use a strong random value in production. |

Security Notes:
1. Never keep the default `admin / admin` combo in production.
2. After changing `ADMIN_PASSWORD`, you can delete the existing admin row in DB and restart to recreate it.
3. Rotate `JWT_SECRET` carefully (existing tokens become invalid). Plan a rollout if sessions matter.

Example `.env`:

```bash
JWT_SECRET=slidev-ai-jwt-secret-key
PORT=3001
SLIDEV_MCP_REPO=https://github.com/LSTM-Kirigaya/slidev-mcp
SLIDEV_MCP_PATH=slidev-mcp
SLIDEV_MCP_UPDATE_INTERVAL=3600000
OPENAI_API_KEY=sk-xxxxxxxPLACEHOLDER
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat
ADMIN_USER=admin
ADMIN_PASSWORD=ChangeMe_123!
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
