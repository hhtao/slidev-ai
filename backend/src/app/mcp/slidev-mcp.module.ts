import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SlidevMcpService } from './slidev-mcp.service';

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [SlidevMcpService],
    exports: [SlidevMcpService],
})
export class SlidevMcpModule { }
