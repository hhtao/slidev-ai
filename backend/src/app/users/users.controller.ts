import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException, UseGuards, Patch, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '@/app/users/users.repository';
import { User } from '@/app/users/user.entity';
import { CreateUserDto, UserResponseDto, UpdateProfileDto } from './user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UseAvatarUploader } from '@/decorators/file-upload.decorator';
import { Request } from 'express';

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

    
}