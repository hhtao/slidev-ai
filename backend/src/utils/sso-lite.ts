import path from "path";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { extname } from 'path';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export function root() {
    return path.join(
        __dirname,
        '..',
        'uploads'
    )
}

export function signID() {
    const uuid = uuidv4();
    return 'sso-lite.' + uuid;
}

export function getPath(...paths: string[]) {
    return path.join(root(), ...paths);
}

export async function downloadFile(url: string, savePath: string, httpService: HttpService) {
    // 确保目录存在
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    try {
        // 使用 axiosRef 获取原生 axios 实例
        const response = await httpService.axiosRef({
            url,
            method: 'GET',
            responseType: 'stream', // 流式下载
            maxRedirects: 5,
        });

        // 写入文件
        const writer = fs.createWriteStream(savePath);
        return new Promise<void>((resolve, reject) => {
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        throw new Error(`Failed to download file from ${url}: ${err.message}`);
    }
}

const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
};

export async function getImageExtension(
    url: string,
    httpService: HttpService,
): Promise<string> {
    try {
        // 1. 从 URL 提取扩展名
        const parsedExt = extname(new URL(url).pathname);
        if (parsedExt && parsedExt.length > 1) {
            return parsedExt.toLowerCase();
        }

        // 2. 如果没有扩展名，尝试用 HEAD 请求获取 Content-Type
        const response = await firstValueFrom(
            httpService.head(url, { maxRedirects: 5 }),
        );
        const contentType = response.headers['content-type'];
        if (contentType && mimeToExt[contentType]) {
            return mimeToExt[contentType];
        }

        // 3. 默认兜底
        return '.jpg';
    } catch (err) {
        // 网络错误/非法 URL 时兜底
        return '.jpg';
    }
}