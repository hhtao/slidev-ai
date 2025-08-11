import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.dto';
import { Slide } from './slide/slide.dto';
import { UserService } from './user/user.service';
import { SlideService } from './slide/slide.service';
import { UserController } from './user/user.controller';
import { SlideController } from './slide/slide.controller';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User, Slide])],
    providers: [UserService, SlideService],
    controllers: [UserController, SlideController],
    exports: [UserService, SlideService, TypeOrmModule],
})
export class DatabasesModule {}
