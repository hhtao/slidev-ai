import { Request, Response, NextFunction } from 'express';
import path from 'path';

/**
 * SPA 回退中间件
 * 对于非 API、非静态资源的请求，返回 index.html
 * @param options 配置选项
 */
export function spaFallbackMiddleware(options?: {
    spaPath?: string;          // SPA 文件路径，默认 './app'
    excludedPrefixes?: string[]; // 排除的前缀，默认 ['/api', '/docs', '/uploads']
    staticExtensions?: string[]; // 静态资源扩展名
}) {
    // 默认配置
    const config = {
        spaPath: options?.spaPath || path.join(process.cwd(), 'app'),
        excludedPrefixes: options?.excludedPrefixes || ['/api', '/docs', '/uploads'],
        staticExtensions: options?.staticExtensions || [
            'js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg',
            'ttf', 'woff', 'woff2', 'json', 'html', 'txt', 'map'
        ]
    };

    // 构建静态资源正则表达式
    const staticRegex = new RegExp(`\\.(${config.staticExtensions.join('|')})$`, 'i');

    return (req: Request, res: Response, next: NextFunction) => {
        const url = req.url;

        // 检查是否应该排除
        const isExcluded = config.excludedPrefixes.some(prefix =>
            url.startsWith(prefix + '/') || url === prefix
        );

        // 如果已经发送了响应头，跳过处理
        if (res.headersSent) {
            return next();
        }

        // 如果是排除的路由，交给下一个中间件
        if (isExcluded) {
            return next();
        }


        // 检查是否是静态资源
        const isStaticResource = staticRegex.test(url);

        // 如果是静态资源，返回
        if (isStaticResource) {
            const resourcePath = path.resolve(path.join(config.spaPath, url));
            console.log('send', resourcePath);
            
            return res.sendFile(resourcePath);
        }


        // 返回 SPA 的 index.html
        const indexPath = path.resolve(path.join(config.spaPath, 'index.html'));

        // 可选：添加调试日志
        if (process.env.NODE_ENV === 'development') {
            console.log(`SPA fallback: ${url} -> ${indexPath}`);
        }


        console.log('send', indexPath);

        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('SPA fallback error:', err);
                if (!res.headersSent) {
                    res.status(500).send('SPA fallback failed');
                }
            }
        });
    };
}