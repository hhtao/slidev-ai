import { Controller, Get, Post, Delete, Param, Query, UseGuards, Body, ParseIntPipe } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { JwtAuthGuard } from '@/app/auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { Invitation } from './invitation.entity';

class CreateInvitationDto {
    code?: string;
}

class InvitationResponseDto {
    id: number;
    code: string;
    createdAt: Date;
}

class PaginatedInvitationsDto {
    invitations: InvitationResponseDto[];
    total: number;
    page: number;
    limit: number;
}

@ApiTags('invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationsController {
    constructor(private readonly invitationService: InvitationService) { }

    @ApiOperation({ summary: '获取邀请码列表' })
    @ApiResponse({ status: 200, description: '成功获取邀请码列表', type: PaginatedInvitationsDto })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
    @Get()
    async findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    ) {
        // Ensure limit does not exceed 20
        const actualLimit = Math.min(limit, 20);

        // Get all invitations and implement pagination manually
        const allInvitations = await this.invitationService.findAll();
        const total = allInvitations.length;
        const startIndex = (page - 1) * actualLimit;
        const invitations = allInvitations.slice(startIndex, startIndex + actualLimit);

        return {
            invitations: invitations.map(invitation => ({
                id: invitation.id,
                code: invitation.code,
                createdAt: invitation.createdAt,
            })),
            total,
            page,
            limit: actualLimit,
        };
    }

    @ApiOperation({ summary: '创建邀请码' })
    @ApiResponse({ status: 201, description: '成功创建邀请码', type: InvitationResponseDto })
    @ApiBody({ type: CreateInvitationDto, required: false })
    @Post()
    async create(@Body() createInvitationDto?: CreateInvitationDto) {
        const invitation = await this.invitationService.create(createInvitationDto?.code);
        return {
            id: invitation.id,
            code: invitation.code,
            createdAt: invitation.createdAt,
        };
    }

    @ApiOperation({ summary: '删除邀请码' })
    @ApiResponse({ status: 200, description: '成功删除邀请码' })
    @ApiParam({ name: 'id', type: Number, description: '邀请码ID' })
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.invitationService.delete(id);
        return { message: 'Invitation deleted successfully' };
    }
}