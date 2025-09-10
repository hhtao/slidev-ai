import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

async function initDatabase() {
    const isDev = process.env.NODE_ENV === 'development';

    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);

    if (isDev) {
        // 仅在开发模式下执行 schema 同步
        await dataSource.synchronize();
        console.log('✅ Database schema synchronized (development mode)');
    } else {
        console.log('⚠️ Skipped synchronize: NODE_ENV is not development. Use migrations in production.');
    }

    await app.close();
}

initDatabase().catch((error) => {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
});
