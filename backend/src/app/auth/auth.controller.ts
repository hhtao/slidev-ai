import { Controller, Post, Body, HttpCode, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@/app/users/user.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService
    ) { }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @HttpCode(200)
    @Post('login')
    async login(
        @Res({ passthrough: true }) res: Response,
        @Body() loginDto?: { username: string; password: string }
    ) {

        if (!loginDto) {
            return {
                success: false,
                message: 'Invalid token',
                user: null
            };
        }

        // 正常登录流程
        const user = await this.authService.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            return { error: 'Invalid credentials' };
        }
        const { accessToken } = await this.authService.login(user);

        // 设置 cookie
        res.cookie('jwt', accessToken, {
            httpOnly: true,
            sameSite: 'lax',
            // secure: true, // 生产环境建议开启
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
        });

        return {
            success: true,
            message: 'Login successful',
            user
        };
    }

    @Post('logout')
    @HttpCode(200)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        // 清除 JWT Cookie
        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'lax',
            // secure: true, // 生产环境建议开启
        });

        return { success: true, message: 'Logged out successfully' };
    }
}