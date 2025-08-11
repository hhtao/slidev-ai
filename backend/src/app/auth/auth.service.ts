import { CreateUserDto } from '@/app/users/user.dto';
import { UserRepository } from '@/app/users/users.repository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private userRepository: UserRepository,
        private jwtService: JwtService,
    ) { }

    async register(createUserDto: CreateUserDto): Promise<{ accessToken: string }> {
        // Check if user already exists
        const existingUser = await this.userRepository.findOneByUsername(createUserDto.username);
        if (existingUser) {
            throw new UnauthorizedException('Username already exists');
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        createUserDto.password = hashedPassword;
        // 创建用户
        const user = await this.userRepository.create(createUserDto);

        // Generate JWT token
        const payload = { username: user.username, sub: user.id };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.userRepository.findOneByUsername(username);
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any): Promise<{ accessToken: string }> {
        const payload = { username: user.username, sub: user.id };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}