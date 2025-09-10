import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SlidesModule } from './app/slides/slides.module';
import { UsersModule } from './app/users/users.module';
import { AuthModule } from './app/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SsoLite } from './utils';
import { SlidevMcpModule } from './app/mcp/slidev-mcp.module';

console.log('当前 NODE_ENV:', process.env.NODE_ENV);

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: 'database.sqlite',
            autoLoadEntities: true,
            synchronize: process.env.NODE_ENV === 'development',
        }),
        SlidevMcpModule,
        SlidesModule,
        UsersModule,
        AuthModule,
        ServeStaticModule.forRoot({
            rootPath: SsoLite.root(),
            serveRoot: '/uploads/',
        }),
        ServeStaticModule.forRoot({
            rootPath: './app', // 假设 vue build 输出到 dist
            exclude: ['/api(.*)', '/uploads(.*)'], // 很关键！排除 /api 和 /uploads
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }