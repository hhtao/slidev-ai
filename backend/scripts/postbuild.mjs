import fsPath from 'node:path';
import fs from 'node:fs';
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

const backendDistPath = fsPath.join(rootDistPath, 'backend');
recreateDir(backendDistPath);

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