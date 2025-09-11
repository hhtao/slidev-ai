import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

async function initDatabase() {
    const isDev = process.env.NODE_ENV === 'development';

    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);

    await dataSource.synchronize();
    console.log('✅ Database schema synchronized (development mode)');

    await app.close();
}

initDatabase().catch((error) => {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
});
