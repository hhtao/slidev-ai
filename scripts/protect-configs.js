const fs = require('fs');
const path = require('path');

const configs = [
    {
        file: 'frontend/vite.config.ts',
        content: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/uploads': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                // 不需要重写路径，直接透传
            },
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                // 不需要重写路径，直接透传
            }
        }
    }
})`
    }
];

function protectFile(filePath, content) {
    const fullPath = path.join(__dirname, '..', filePath);

    // 写入正确内容
    fs.writeFileSync(fullPath, content, 'utf8');

    // 尝试设置只读属性（Windows）
    try {
        fs.chmodSync(fullPath, 0o444); // 只读
        console.log(`🔒 Set read-only: ${filePath}`);
    } catch (err) {
        console.warn(`⚠️  Could not set read-only for ${filePath}`);
    }
}

function watchAndProtect(filePath, content) {
    const fullPath = path.join(__dirname, '..', filePath);

    console.log(`👁️  Watching: ${filePath}`);

    fs.watchFile(fullPath, { interval: 500 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
            console.log(`🔄 File changed: ${filePath}`);

            // 立即恢复内容
            setTimeout(() => {
                fs.writeFile(fullPath, content, 'utf8', (err) => {
                    if (err) console.error(`❌ Failed to restore: ${filePath}`, err);
                    else console.log(`✅ Restored: ${filePath}`);
                });
            }, 100);
        }
    });
}

// 保护所有配置文件
configs.forEach(config => {
    protectFile(config.file, config.content);
    watchAndProtect(config.file, config.content);
});

console.log('🛡️  Config file protection started...');

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n👋 Stopping protection...');
    configs.forEach(config => {
        const fullPath = path.join(__dirname, '..', config.file);
        fs.unwatchFile(fullPath);
        // 恢复可写权限
        try {
            fs.chmodSync(fullPath, 0o644);
        } catch (err) {}
    });
    process.exit(0);
});