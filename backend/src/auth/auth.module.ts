import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { UserRepository } from '@/databases/repository/user';
import { SlideRepository } from '@/databases/repository/slide';

@Module({
    imports: [
        UsersModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET', 'defaultSecretKey');
                console.log('Module secret', secret); // 这里才会拿到正确值
                return {
                    secret,
                    signOptions: { expiresIn: '7d' },
                };
            },
        }),
    ],
    providers: [AuthService, JwtStrategy, UserRepository, SlideRepository],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }