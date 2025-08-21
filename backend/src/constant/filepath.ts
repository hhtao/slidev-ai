import { resolve, sep } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

function detectBackendRoot(currentDir: string): string {
	const distIdx = currentDir.lastIndexOf(`${sep}dist`);
	if (distIdx !== -1) return currentDir.slice(0, distIdx);
	const srcIdx = currentDir.lastIndexOf(`${sep}src`);
	if (srcIdx !== -1) return currentDir.slice(0, srcIdx);
	return currentDir; // 兜底：已经是根
}

const BACKEND_ROOT = detectBackendRoot(__dirname);

// 支持通过环境变量覆盖，未设置则默认 backend/markdown-files
const MARKDOWN_FILES_ROOT = resolve(
	process.env.SLIDEV_MCP_ROOT || BACKEND_ROOT,
	process.env.SLIDEV_MCP_SUBDIR || 'markdown-files'
);

// 若目录不存在则尝试创建（递归）
if (!existsSync(MARKDOWN_FILES_ROOT)) {
	try {
		mkdirSync(MARKDOWN_FILES_ROOT, { recursive: true });
	} catch (e) {
		// 静默失败：上层代码可按需捕获/日志打点
	}
}

console.log("Slidev Mcp Root:"+MARKDOWN_FILES_ROOT);

export { MARKDOWN_FILES_ROOT as SLIDEV_MCP_ROOT, BACKEND_ROOT };