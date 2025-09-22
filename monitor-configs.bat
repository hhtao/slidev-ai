@echo off
echo 👁️  正在监控配置文件...
echo.
echo 💡 提示：按 Ctrl+C 停止监控
echo.

:loop
timeout /t 2 /nobreak > nul

REM 检查vite.config.ts
echo [INFO] 检查 vite.config.ts...
findstr /C:"'/api': {" frontend/vite.config.ts > nul
if %errorlevel% neq 0 (
    echo ⚠️  vite.config.ts 缺少API路由，正在修复...

    REM 创建临时文件
    (
        echo import { defineConfig } from 'vite'
        echo import vue from '@vitejs/plugin-vue'
        echo import { resolve } from 'path'
        echo.
        echo // https://vitejs.dev/config/
        echo export default defineConfig({
        echo     plugins: [vue()],
        echo     resolve: {
        echo         alias: {
        echo             '@': resolve(__dirname, './src')
        echo         },
        echo     },
        echo     server: {
        echo         port: 3000,
        echo         proxy: {
        echo             '/uploads': {
        echo                 target: 'http://localhost:3001',
        echo                 changeOrigin: true,
        echo                 // 不需要重写路径，直接透传
        echo             },
        echo             '/api': {
        echo                 target: 'http://localhost:3001',
        echo                 changeOrigin: true,
        echo                 // 不需要重写路径，直接透传
        echo             }
        echo         }
        echo     }
        echo })
    ) > frontend/vite.config.ts.tmp

    move /y frontend/vite.config.ts.tmp frontend/vite.config.ts
    echo ✅ 已修复 vite.config.ts
)

goto loop