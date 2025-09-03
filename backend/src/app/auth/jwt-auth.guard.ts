import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        // console.log('JwtAuthGuard token:', authHeader);
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        // console.log('JwtAuthGuard', err, user, info);
        if (err || !user) {
            throw err || new UnauthorizedException('Token is invalid or expired');
        }
        return user;
    }
}
