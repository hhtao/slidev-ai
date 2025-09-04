import { Controller, Post, Get, Param, Body, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { ResetPasswordService } from './reset-password.service';
import { JwtAuthGuard } from '@/app/auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

class GenerateResetHashDto {
    userId: number;
}

class ResetPasswordDto {
    hashId: string;
    newPassword: string;
}

@ApiTags('reset-password')
@Controller('reset-password')
export class ResetPasswordController {
    constructor(private readonly resetPasswordService: ResetPasswordService) { }

    @ApiOperation({ summary: '为用户生成密码重置链接' })
    @ApiResponse({ status: 201, description: '成功生成密码重置链接' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('generate')
    async generateResetHash(
        @Body() generateResetHashDto: GenerateResetHashDto,
        @Req() req: Request
    ) {
        const resetPassword = await this.resetPasswordService.generateResetHash(generateResetHashDto.userId);
        return {
            hashId: resetPassword.hashId,
            resetLink: `${req.protocol}://${req.get('host')}/api/reset-password/${resetPassword.hashId}`
        };
    }

    @ApiOperation({ summary: '通过哈希ID重置密码' })
    @ApiResponse({ status: 200, description: '密码重置成功' })
    @ApiResponse({ status: 400, description: '密码重置失败' })
    @ApiBody({ type: ResetPasswordDto })
    @Post()
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        const success = await this.resetPasswordService.resetPassword(
            resetPasswordDto.hashId, 
            resetPasswordDto.newPassword
        );
        
        if (success) {
            return { message: 'Password reset successfully' };
        } else {
            return { 
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Invalid or expired reset link'
            };
        }
    }

    @ApiOperation({ summary: '通过哈希ID获取重置密码页面' })
    @ApiResponse({ status: 200, description: '返回重置密码页面' })
    @ApiParam({ name: 'hashId', type: String, description: '密码重置哈希ID' })
    @Get(':hashId')
    async getResetPage(@Param('hashId') hashId: string, @Res() res: Response) {
        // This endpoint will serve the Vue frontend page
        // For now, we'll just return a simple response
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reset Password</title>
            </head>
            <body>
                <div id="reset-password-app">
                    <h1>Password Reset</h1>
                    <p>Use the Vue frontend to handle password reset.</p>
                    <p>Hash ID: ${hashId}</p>
                </div>
            </body>
            </html>
        `);
    }
}