const fs = require('fs');
const path = require('path');

const configs = {
    'frontend/vite.config.ts': {
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
})`,
        checksum: null
    }
};

function calculateChecksum(content) {
    return require('crypto').createHash('md5').update(content).digest('hex');
}

function watchFile(filePath, expectedContent) {
    const fullPath = path.join(__dirname, '..', filePath);
    const expectedChecksum = calculateChecksum(expectedContent);

    console.log(`👁️  Watching: ${filePath}`);

    fs.watchFile(fullPath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
            console.log(`🔄 File changed: ${filePath}`);

            fs.readFile(fullPath, 'utf8', (err, data) => {
                if (err) return;

                const currentChecksum = calculateChecksum(data);

                if (currentChecksum !== expectedChecksum) {
                    console.log(`⚠️  Restoring: ${filePath}`);
                    fs.writeFile(fullPath, expectedContent, 'utf8', (err) => {
                        if (err) console.error(`❌ Failed to restore: ${filePath}`, err);
                        else console.log(`✅ Restored: ${filePath}`);
                    });
                }
            });
        }
    });
}

// 启动监控
Object.entries(configs).forEach(([filePath, config]) => {
    watchFile(filePath, config.content);
});

console.log('🔍 Config file watcher started...');

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n👋 Stopping watcher...');
    Object.keys(configs).forEach(filePath => {
        const fullPath = path.join(__dirname, '..', filePath);
        fs.unwatchFile(fullPath);
    });
    process.exit(0);
});