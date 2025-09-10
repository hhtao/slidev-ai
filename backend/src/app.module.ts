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
import path from 'path';

console.log('current NODE_ENV:', process.env.NODE_ENV);
console.log('current app:', process.env.NODE_ENV === 'development' ? path.join(__dirname, '..', '..', 'dist', 'app') : './app');


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
        })
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }