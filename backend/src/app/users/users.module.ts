import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './users.repository';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlidesModule } from '@/app/slides/slides.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        SlidesModule,
    ],
    providers: [UserRepository, UsersService],
    controllers: [UsersController],
    exports: [UsersService, UserRepository],
})
export class UsersModule { }