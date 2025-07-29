import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Slide } from './slide.entity';
import { SlidesService } from './slides.service';
import { SlidesController } from './slides.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Slide]), UsersModule],
  providers: [SlidesService],
  controllers: [SlidesController],
  exports: [SlidesService],
})
export class SlidesModule {}