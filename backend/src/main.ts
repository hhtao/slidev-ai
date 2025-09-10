// 先执行 LLM 环境变量检查（若缺失会直接退出）
import './init-llm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import cookieParser from 'cookie-parser';
import { SlidevManagerService } from './app/slides/slidev-manager.service';
import morgan from 'morgan';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SsoLite } from './utils';

function setupSwagger(app: INestApplication) {
    const config = new DocumentBuilder()
        .setTitle('Slidev AI API')
        .setDescription('The Slidev AI API description')
        .setVersion('1.0')
        .addTag('slidev')
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, documentFactory, {
        customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
        customJs: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js'
        ]
    });
}
async function bootstrap() {
    // 确保uploads目录存在
    const uploadDir = SsoLite.root();
    if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir);
    }

    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    setupSwagger(app);
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({
        origin: 'http://localhost:3000',
        credentials: true,
    });
    app.use(morgan('dev'));


    const slidevManager = app.get(SlidevManagerService);

    // 处理意外退出的清理函数
    const cleanup = () => {
        console.log('应用程序正在关闭，清理所有Slidev进程...');
        slidevManager.onApplicationShutdown();
    };

    // 监听进程退出信号
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGQUIT', cleanup);
    const dumpError = (label: string, err: any) => {
        if (err instanceof Error) {
            console.error(`${label}:`, err.message);
            console.error('Name:', err.name);
            console.error('Stack:\n' + err.stack);
            // 展示 enumerable 自定义属性
            const extras = Object.keys(err).reduce((acc: any, k) => { acc[k] = (err as any)[k]; return acc; }, {});
            if (Object.keys(extras).length) console.error('Extra fields:', extras);
        } else {
            console.error(`${label}:`, err);
            try {
                console.error('Serialized:', JSON.stringify(err, null, 2));
            } catch { /* ignore */ }
        }
    };

    process.on('uncaughtException', (error) => {
        dumpError('未捕获的异常', error);
        // 如果需要在开发环境看到 Node 默认格式，可选择重新抛出而不是直接 exit
        if (process.env.NODE_ENV === 'development') {
            try { cleanup(); } finally { throw error; }
        } else {
            cleanup();
            process.exit(1);
        }
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('未处理的 Promise 拒绝，Promise:', promise);
        dumpError('原因', reason);
        if (process.env.NODE_ENV === 'development' && reason instanceof Error) {
            try { cleanup(); } finally { throw reason; }
        } else {
            cleanup();
            process.exit(1);
        }
    });

    await app.listen(3001);
}
bootstrap();