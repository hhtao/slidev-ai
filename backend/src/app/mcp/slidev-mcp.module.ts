import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SlidevMcpService } from './slidev-mcp.service';
import { SlidevMcpController } from './slidev-mcp.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ThemeRepository } from './theme.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Theme } from './theme.entity';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        HttpModule,
        TypeOrmModule.forFeature([Theme]),
    ],
    controllers: [
        SlidevMcpController
    ],
    providers: [
        SlidevMcpService,
        ThemeRepository
    ],
    exports: [
        SlidevMcpService,
        ThemeRepository
    ],
})
export class SlidevMcpModule { }
