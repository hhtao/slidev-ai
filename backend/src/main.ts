// 先执行 LLM 环境变量检查（若缺失会直接退出）
import './init-llm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import cookieParser from 'cookie-parser';
import { SlidevManagerService } from './app/slides/slidev-manager.service';
import morgan from 'morgan';
import { SsoLite } from './utils';
import { setupSwaggerMiddleware } from './middleware/swagger.middleware';
import { spaFallbackMiddleware } from './middleware/spa-fallback.middleware';
import path from 'path';

async function bootstrap() {

    // 确保uploads目录存在
    const uploadDir = SsoLite.root();
    if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir);
    }

    const app = await NestFactory.create(AppModule);
    
    // 设置全局前缀 api
    app.setGlobalPrefix('api');

    // 添加 swagger
    setupSwaggerMiddleware(app);

    // 添加 cookie 解析器
    app.use(cookieParser());

    // 添加参数验证
    app.useGlobalPipes(new ValidationPipe());

    if (process.env.NODE_ENV === 'development') {
        app.enableCors({
            origin: 'http://localhost:3000',
            credentials: true,
        });
    }

    // 设置 logger
    app.use(morgan('dev'));

    // 启动 SPA 回退中间件
    app.use(spaFallbackMiddleware({
        spaPath: process.env.NODE_ENV === 'development' ? path.join(__dirname, '..', '..', 'dist', 'app') : './app',
        excludedPrefixes: ['/api', '/docs', '/uploads'],
    }));


    await app.listen(process.env.PORT || 3001);
}
bootstrap();