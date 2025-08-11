import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '@/databases/repository/user';
import { CreateUserDto, User } from '@/databases/dto/user';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        @InjectRepository(UserRepository)
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