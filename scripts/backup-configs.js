const fs = require('fs');
const path = require('path');

const configs = [
    'frontend/vite.config.ts',
    'frontend/src/router/index.ts',
    'frontend/src/components/Navbar.vue',
    'frontend/src/i18n/locales/bundle.l10n.zh.json',
    'frontend/src/i18n/locales/bundle.l10n.en.json'
];

function backupConfigs() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'config-backups', timestamp);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    configs.forEach(config => {
        const srcPath = path.join(__dirname, '..', config);
        const destPath = path.join(backupDir, config.replace(/\//g, '-'));

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Backed up: ${config}`);
        }
    });

    console.log(`\n📁 Backup completed: ${backupDir}`);
}

// 如果直接运行此脚本
if (require.main === module) {
    backupConfigs();
}

module.exports = { backupConfigs };