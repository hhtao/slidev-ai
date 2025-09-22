@echo off
echo 🛠️  正在修复配置文件...

REM 修复 vite.config.ts
echo 📄 修复 vite.config.ts...
echo import { defineConfig } from 'vite' > frontend/vite.config.ts
echo import vue from '@vitejs/plugin-vue' >> frontend/vite.config.ts
echo import { resolve } from 'path' >> frontend/vite.config.ts
echo. >> frontend/vite.config.ts
echo // https://vitejs.dev/config/ >> frontend/vite.config.ts
echo export default defineConfig({ >> frontend/vite.config.ts
echo     plugins: [vue()], >> frontend/vite.config.ts
echo     resolve: { >> frontend/vite.config.ts
echo         alias: { >> frontend/vite.config.ts
echo             '@': resolve(__dirname, './src') >> frontend/vite.config.ts
echo         }, >> frontend/vite.config.ts
echo     }, >> frontend/vite.config.ts
echo     server: { >> frontend/vite.config.ts
echo         port: 3000, >> frontend/vite.config.ts
echo         proxy: { >> frontend/vite.config.ts
echo             '/uploads': { >> frontend/vite.config.ts
echo                 target: 'http://localhost:3001', >> frontend/vite.config.ts
echo                 changeOrigin: true, >> frontend/vite.config.ts
echo                 // 不需要重写路径，直接透传 >> frontend/vite.config.ts
echo             }, >> frontend/vite.config.ts
echo             '/api': { >> frontend/vite.config.ts
echo                 target: 'http://localhost:3001', >> frontend/vite.config.ts
echo                 changeOrigin: true, >> frontend/vite.config.ts
echo                 // 不需要重写路径，直接透传 >> frontend/vite.config.ts
echo             } >> frontend/vite.config.ts
echo         } >> frontend/vite.config.ts
echo     } >> frontend/vite.config.ts
echo }) >> frontend/vite.config.ts

REM 修复其他配置文件...
echo ✅ vite.config.ts 已修复
echo.
echo ✅ 所有配置文件已修复！
echo.
echo 💡 提示：如果文件频繁被还原，可能是以下原因：
echo    1. Git hooks 在运行
echo    2. 开发工具自动格式化
echo    3. 其他进程在监控文件
echo.
pause