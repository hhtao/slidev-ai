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
    const uploadDir = join(__dirname, '..', 'uploads');
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
    process.on('uncaughtException', (error) => {
        console.error('未捕获的异常:', error);
        cleanup();
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('未处理的Promise拒绝:', reason);
        cleanup();
        process.exit(1);
    });

    await app.listen(3001);
}
bootstrap();