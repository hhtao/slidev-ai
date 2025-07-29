import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Slide } from './slides/slide.entity';
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