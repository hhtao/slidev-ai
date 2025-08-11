import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from '@/databases/repository/user';

@Module({
    providers: [UserRepository, UsersService],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule { }