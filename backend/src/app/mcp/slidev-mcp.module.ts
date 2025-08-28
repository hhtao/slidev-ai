import { Module } from '@nestjs/common';
import { SlidevMcpService } from './slidev-mcp.service';
import { SlidevMcpController } from './slidev-mcp.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [SlidevMcpController],
    providers: [SlidevMcpService],
    exports: [SlidevMcpService],
})
export class SlidevMcpModule { }
