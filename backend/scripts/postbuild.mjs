import fsPath from 'node:path';
import fs from 'fs-extra';
import * as process from "node:process";

function createDirIfExists(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
    }
}

function recreateDir(filePath) {
    if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
    }
    fs.mkdirSync(filePath, { recursive: true });
}

const currentDir = process.cwd();

// 确保上级目录的 dist/backend 存在
const rootDistPath = fsPath.join(currentDir, '..', 'dist');
createDirIfExists(rootDistPath);

const backendDistPath = fsPath.join(rootDistPath, 'server');
recreateDir(backendDistPath);

// 将 .env 也搬运到 rootDistPath 里面
if (!fs.existsSync(fsPath.join(currentDir, '.env.production'))) {
    console.error('.env.production file not found, please run `node scripts/install.mjs` to generate it');
    process.exit();
}

fs.copyFileSync(fsPath.join(currentDir, '.env.production'), fsPath.join(rootDistPath, '.env.production'));

const sourceDist = fsPath.join(currentDir, 'dist');

// 如果源目录不存在则报错
if (!fs.existsSync(sourceDist)) {
    throw new Error(`Source directory not found: ${sourceDist}`);
}

// 复制文件的函数
function copyRecursive(source, target) {
    const stats = fs.statSync(source);
    if (stats.isDirectory()) {
        fs.mkdirSync(target, { recursive: true });
        const files = fs.readdirSync(source);
        files.forEach(file => {
            copyRecursive(
                fsPath.join(source, file),
                fsPath.join(target, file)
            );
        });
    } else {
        fs.copyFileSync(source, target);
    }
}

// 执行复制操作
copyRecursive(sourceDist, backendDistPath);
console.log('Backend build artifacts moved successfully to dist/backend');