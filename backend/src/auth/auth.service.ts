import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '@/databases/user/create-user.dto';
import { UserRepository } from '@/databases/user';

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

        // Create user
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