const fs = require('fs');
const path = require('path');

// 导航栏的正确配置
const navbarConfig = `        {
            label: t("theme.manager.nav"),
            icon: 'pi pi-palette',
            visible: () => authStore.user?.role === 'admin',
            command: () => router.push('/themes')
        },
        {
            label: t('nav.knowledge-base'),
            icon: 'pi pi-database',
            visible: () => authStore.user !== null,
            command: () => router.push('/knowledge')
        },
        {
            label: t('nav.ai-slides'),
            icon: 'pi pi-sparkles',
            visible: () => authStore.user !== null,
            command: () => router.push('/knowledge-slides')
        }`;

// 路由的正确配置
const routerConfig = `        {
            path: '/knowledge',
            name: 'knowledge',
            component: () => import('@/views/knowledge/KnowledgeManager.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/knowledge-slides',
            name: 'knowledge-slides',
            component: () => import('@/views/knowledge-slides/KnowledgeSlidevManager.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/preview/:hash',
            name: 'preview',
            component: () => import('@/views/slides/Preview.vue')
        }`;

// 语言文件的正确配置
const zhTranslations = `    "nav.my-slides": "我的幻灯片",
    "nav.invitation-manager": "邀请管理",
    "nav.my-profile": "个人资料",
    "nav.knowledge-base": "知识库",
    "nav.ai-slides": "智能生成",`;

const enTranslations = `    "nav.my-slides": "My Slides",
    "nav.invitation-manager": "Invitation Manager",
    "nav.my-profile": "My Profile",
    "nav.knowledge-base": "Knowledge Base",
    "nav.ai-slides": "AI Slides",`;

function fixNavbar() {
    const navbarPath = path.join(__dirname, 'frontend/src/components/Navbar.vue');
    let content = fs.readFileSync(navbarPath, 'utf8');

    // 检查是否包含知识库导航项（使用中文标签）
    if (!content.includes("'知识库'")) {
        console.log('🔄 修复 Navbar.vue...');

        // 替换主题管理器部分，添加知识库和AI幻灯片
        content = content.replace(
            /{\s*label: t\("theme\.manager\.nav"\),[\s\S]*?command: \(\) => router\.push\('\/themes'\)\s*}/,
            navbarConfig
        );

        fs.writeFileSync(navbarPath, content, 'utf8');
        console.log('✅ Navbar.vue 已修复');
    }
}

function fixRouter() {
    const routerPath = path.join(__dirname, 'frontend/src/router/index.ts');
    let content = fs.readFileSync(routerPath, 'utf8');

    // 检查是否包含知识库路由
    if (!content.includes("'/knowledge'")) {
        console.log('🔄 修复 router/index.ts...');

        // 替换整个路由数组，确保语法正确
        content = content.replace(
            /routes:\s*\[([\s\S]*?)\]/,
            `routes: [\n$1\n        },\n${routerConfig}\n    ]`
        );

        // 添加路由守卫
        if (!content.includes('router.beforeEach')) {
            content = content.replace(
                /export default router$/,
                routerGuard
            );
        }

        fs.writeFileSync(routerPath, content, 'utf8');
        console.log('✅ router/index.ts 已修复');
    }
}

function fixViteConfig() {
    const vitePath = path.join(__dirname, 'frontend/vite.config.ts');
    let content = fs.readFileSync(vitePath, 'utf8');

    // 检查是否包含API代理
    if (!content.includes("'/api'")) {
        console.log('🔄 修复 vite.config.ts...');

        // 添加API代理配置
        content = content.replace(
            /'\/uploads': \{[\s\S]*?\}/,
            `'\/uploads': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                // 不需要重写路径，直接透传
            },
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                // 不需要重写路径，直接透传
            }`
        );

        fs.writeFileSync(vitePath, content, 'utf8');
        console.log('✅ vite.config.ts 已修复');
    }
}

function fixLanguageFiles() {
    // 修复中文语言文件
    const zhPath = path.join(__dirname, 'frontend/src/i18n/locales/bundle.l10n.zh.json');
    let zhContent = fs.readFileSync(zhPath, 'utf8');

    if (!zhContent.includes('"nav.knowledge-base"')) {
        console.log('🔄 修复中文语言文件...');
        zhContent = zhContent.replace(
            /"nav\.my-profile": "个人资料",/,
            '"nav.my-profile": "个人资料",\n    "nav.knowledge-base": "知识库",\n    "nav.ai-slides": "智能生成",'
        );
        fs.writeFileSync(zhPath, zhContent, 'utf8');
        console.log('✅ 中文语言文件已修复');
    }

    // 修复英文语言文件
    const enPath = path.join(__dirname, 'frontend/src/i18n/locales/bundle.l10n.en.json');
    let enContent = fs.readFileSync(enPath, 'utf8');

    if (!enContent.includes('"nav.knowledge-base"')) {
        console.log('🔄 修复英文语言文件...');
        enContent = enContent.replace(
            /"nav\.my-profile": "My Profile",/,
            '"nav.my-profile": "My Profile",\n    "nav.knowledge-base": "Knowledge Base",\n    "nav.ai-slides": "AI Slides",'
        );
        fs.writeFileSync(enPath, enContent, 'utf8');
        console.log('✅ 英文语言文件已修复');
    }
}

function monitorFiles() {
    console.log('👁️  开始监控配置文件...');

    // 立即修复一次
    fixNavbar();
    fixRouter();
    fixViteConfig();
    fixLanguageFiles();

    // 设置文件监控
    const files = [
        { path: 'frontend/src/components/Navbar.vue', fix: fixNavbar },
        { path: 'frontend/src/router/index.ts', fix: fixRouter },
        { path: 'frontend/vite.config.ts', fix: fixViteConfig },
        { path: 'frontend/src/i18n/locales/bundle.l10n.zh.json', fix: fixLanguageFiles },
        { path: 'frontend/src/i18n/locales/bundle.l10n.en.json', fix: fixLanguageFiles }
    ];

    files.forEach(file => {
        const fullPath = path.join(__dirname, file.path);

        fs.watchFile(fullPath, { interval: 1000 }, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
                console.log(`\n🔄 检测到 ${file.path} 被修改`);
                setTimeout(() => {
                    file.fix();
                    console.log(`✅ ${file.path} 已自动修复\n`);
                }, 100);
            }
        });
    });

    console.log('✅ 监控已启动，配置文件将被自动保护\n');
}

// 如果直接运行此脚本
if (require.main === module) {
    monitorFiles();

    // 保持进程运行
    process.stdin.resume();

    // 优雅退出
    process.on('SIGINT', () => {
        console.log('\n👋 停止监控...');
        process.exit(0);
    });
}

module.exports = { monitorFiles, fixNavbar, fixRouter, fixViteConfig };