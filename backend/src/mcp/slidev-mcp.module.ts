import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SlidevMcpService } from './slidev-mcp.service';

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [SlidevMcpService],
})
export class SlidevMcpModule { }
