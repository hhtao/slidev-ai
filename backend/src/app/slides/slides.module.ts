import { Module } from '@nestjs/common';
import { SlidesController } from './slides.controller';
import { SlidevMcpModule } from '@/app/mcp/slidev-mcp.module';
import { SlidevMcpService } from '@/app/mcp/slidev-mcp.service';
import { SlidesService } from './slides.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Slide } from './slide.entity';
import { SlideRepository } from './slide.repository';
import { SlidevManagerService } from './slidev-manager.service';
import { SlidesPresentationController } from './presentation.controller';
@Module({
    imports: [
        SlidevMcpModule,
        TypeOrmModule.forFeature([Slide]),
    ],
    providers: [
        SlidesService,
        SlidevManagerService,
        SlideRepository
    ],
    controllers: [
        SlidesController,
        SlidesPresentationController
    ],
    exports: [SlidesService, SlideRepository],
})
export class SlidesModule { }