import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.dto';
import { Slide } from './slide/slide.dto';
import { UserRepository } from './user';
import { SlideRepository } from './slide';
import { UserController } from './user/user.controller';
import { SlideController } from './slide/slide.controller';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User, Slide])],
    providers: [UserRepository, SlideRepository],
    controllers: [UserController, SlideController],
    exports: [UserRepository, SlideRepository, TypeOrmModule],
})
export class DatabasesModule {}
