import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@/databases/user/user.dto';
import { CreateUserDto } from '@/databases/user/create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    async create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.create(createUserDto);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
        const user = await this.usersService.findOneById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
}