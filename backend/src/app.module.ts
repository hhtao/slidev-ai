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

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: 'database.sqlite',
            autoLoadEntities: true,
            synchronize: true,
        }),
        ServeStaticModule.forRoot({
            rootPath: SsoLite.root(),
            serveRoot: '/uploads/',
        }),
        SlidevMcpModule,
        SlidesModule,
        UsersModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }