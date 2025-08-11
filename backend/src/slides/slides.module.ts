import { Module } from '@nestjs/common';
import { SlidesController } from './slides.controller';
import { SlidevMcpModule } from '@/mcp/slidev-mcp.module';
import { SlidevMcpService } from '@/mcp/slidev-mcp.service';
import { SlidesService } from './slides.service';
@Module({
    imports: [
        SlidevMcpModule,
    ],
    providers: [SlidevMcpService, SlidesService],
    controllers: [SlidesController],
    exports: [SlidesService],
})
export class SlidesModule { }