import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '@/app/users/users.repository';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private userRepository: UserRepository) {
        super({
            // 自定义从 Cookie 提取 JWT
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    console.log(request.cookies);
                    return request.cookies?.jwt;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'defaultSecretKey',
        });
    }

    async validate(payload: any) {
        return await this.userRepository.findOneById(payload.sub);
    }
}