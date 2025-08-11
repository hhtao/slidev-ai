import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './dto/user';
import { Slide } from './dto/slide';
import { UserRepository } from './repository/user';
import { SlideRepository } from './repository/slide';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User, Slide])],
    providers: [UserRepository, SlideRepository],
    exports: [UserRepository, SlideRepository],
})
export class DatabasesModule {}
