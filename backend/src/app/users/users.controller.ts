import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException, UseGuards, Patch, Req, BadRequestException, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse, ApiBody, ApiBearerAuth, ApiConsumes, ApiQuery, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserRepository } from '@/app/users/users.repository';
import { User } from '@/app/users/user.entity';
import { CreateUserDto, UserResponseDto, UpdateProfileDto } from './user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UseAvatarUploader } from '@/decorators/file-upload.decorator';
import { Request } from 'express';
import * as bcrypt from 'bcryptjs';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly userRepository: UserRepository
    ) { }
    
    // 注意：必须放在 ':id' 动态参数路由之前，否则会被当作 id 解析导致 400
    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: '获取当前登录用户信息' })
    @ApiOkResponse({ description: '查询成功', type: UserResponseDto })
    async me(@Req() req: Request): Promise<UserResponseDto> {
        const user = req.user as User;
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


    @Patch('me')
    @UseGuards(AuthGuard('jwt'))
    @UseAvatarUploader('avatar')
    @ApiOperation({ summary: '更新当前用户资料（邮箱、头像）' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ description: '表单数据（可包含 email 和 avatar 文件）', schema: {
        type: 'object',
        properties: {
            email: { type: 'string', example: 'newalice@example.com' },
            avatar: { type: 'string', format: 'binary' }
        }
    } })
    async updateMe(
        @Req() req: Request,
        @Body() dto: UpdateProfileDto,
    ): Promise<UserResponseDto> {
        const user = req.user as User;
        const file: any = (req as any).file;
        
        const update: any = {};
        if (dto.email) {
            update.email = dto.email
        }

        if (dto.website) {
            update.website = dto.website;
        }

        if (dto.egoId) {
            update.egoId = parseInt(dto.egoId);
        }

        if (file) {
            // 存入带路径的相对 URL，文件名已采用 UUID 生成
            update.avatar = `${file.filename}`;
        }

        const updated = await this.userRepository.update(user.id, update);
        const { password, ...safe } = updated as any;
        return safe;
    }

    
    @Get('role/:role')
    @ApiOperation({ summary: '根据角色获取用户列表' })
    @ApiOkResponse({ description: '查询成功', type: [UserResponseDto] })
    async findByRole(@Param('role') role: string): Promise<UserResponseDto[]> {
        const users = await this.userRepository.findByRole(role);
        return users.map(user => {
            const { password, ...safe } = user as any;
            return safe;
        });
    }

    
    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: '分页获取用户列表（仅限管理员）' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '页码 (默认为 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量 (默认为 15)' })
    @ApiOkResponse({ description: '查询成功' })
    @ApiUnauthorizedResponse({ description: '未授权' })
    @ApiForbiddenResponse({ description: '权限不足' })
    async findAll(
        @Req() req: Request,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 15
    ): Promise<{ users: UserResponseDto[], total: number, page: number, limit: number }> {
        // 检查用户是否为管理员
        const currentUser = req.user as User;
        if (currentUser.role !== 'admin') {
            throw new BadRequestException('权限不足，仅管理员可访问');
        }

        // 限制每页最大数量
        if (limit > 100) {
            limit = 100;
        }

        const [users, total] = await this.userRepository.findAll((page - 1) * limit, limit);
        
        const userResponses = users.map(user => {
            const { password, ...safe } = user as any;
            return safe;
        });

        return {
            users: userResponses,
            total,
            page,
            limit
        };
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: '删除用户（仅限管理员）' })
    @ApiOkResponse({ description: '用户删除成功' })
    @ApiUnauthorizedResponse({ description: '未授权' })
    @ApiForbiddenResponse({ description: '权限不足' })
    @ApiNotFoundResponse({ description: '用户不存在' })
    async remove(
        @Req() req: Request,
        @Param('id', ParseIntPipe) id: number
    ): Promise<void> {
        // 检查用户是否为管理员
        const currentUser = req.user as User;
        if (currentUser.role !== 'admin') {
            throw new BadRequestException('权限不足，仅管理员可访问');
        }

        // 检查用户是否存在
        const user = await this.userRepository.findOneById(id);
        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // 不能删除自己
        if (currentUser.id === id) {
            throw new BadRequestException('不能删除自己');
        }

        await this.userRepository.remove(id);
    }
}