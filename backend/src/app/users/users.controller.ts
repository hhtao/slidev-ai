import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '@/app/users/users.repository';
import { User } from '@/app/users/user.entity';
import { CreateUserDto, UserResponseDto } from './user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly userRepository: UserRepository
    ) { }

    @Post()
    @ApiOperation({ summary: '创建用户', description: '创建一个新的用户账号（密码将被加密存储）。' })
    @ApiBody({ type: CreateUserDto })
    @ApiCreatedResponse({ description: '创建成功，返回用户信息（不含密码）', type: UserResponseDto })
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const user = await this.userRepository.create(createUserDto);
        // 去除密码字段，只返回安全信息
        const { password, ...safe } = user as any;
        return safe;
    }

    @Get(':id')
    @ApiOperation({ summary: '获取单个用户', description: '通过用户 ID 获取用户信息（不含密码）。' })
    @ApiOkResponse({ description: '查询成功', type: UserResponseDto })
    @ApiNotFoundResponse({ description: '用户不存在' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
        const user = await this.userRepository.findOneById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const { password, ...safe } = user as any;
        return safe;
    }
}