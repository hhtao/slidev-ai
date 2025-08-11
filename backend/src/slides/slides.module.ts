import { Module } from '@nestjs/common';
import { SlideRepository } from '@/databases/slide';
import { SlidesController } from './slides.controller';
import { SlidevMcpModule } from '@/mcp/slidev-mcp.module';
import { SlidevMcpService } from '@/mcp/slidev-mcp.service';

@Module({
    imports: [SlidevMcpModule],
    providers: [SlideRepository, SlidevMcpService],
    controllers: [SlidesController],
    exports: [SlideRepository],
})
export class SlidesModule { }