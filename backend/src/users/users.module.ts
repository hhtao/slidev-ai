import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/databases/user/user.dto';
import { UserRepository } from '@/databases/user';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    providers: [UserRepository],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule { }