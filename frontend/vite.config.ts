import { defineConfig } from 'vite'
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
            }
        }
    }
})