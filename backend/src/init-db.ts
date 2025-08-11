import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

async function initDatabase() {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);

    // Sync database schema
    await dataSource.synchronize();

    console.log('Database initialized successfully');

    await app.close();
}

initDatabase().catch((error) => {
    console.error('Error initializing database:', error);
    process.exit(1);
});