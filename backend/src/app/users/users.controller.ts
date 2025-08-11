import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '@/app/users/users.repository';
import { CreateUserDto, User } from '@/app/users/user.entity';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly userRepository: UserRepository
    ) { }

    @Post()
    async create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.userRepository.create(createUserDto);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
        const user = await this.userRepository.findOneById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
}