import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.dto';

@Controller('db-users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    async create(@Body() user: Partial<User>): Promise<User> {
        return this.userService.create(user);
    }

    @Get()
    async findAll(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: number): Promise<User | null> {
        return this.userService.findOneById(id);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() update: Partial<User>): Promise<User | null> {
        return this.userService.update(id, update);
    }

    @Delete(':id')
    async remove(@Param('id') id: number): Promise<void> {
        return this.userService.remove(id);
    }
}
