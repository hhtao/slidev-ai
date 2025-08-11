import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { SlideService } from './slide.service';
import { Slide } from './slide.dto';

@Controller('db-slides')
export class SlideController {
    constructor(private readonly slideService: SlideService) {}

    @Post()
    async create(@Body() slide: Partial<Slide>): Promise<Slide> {
        return this.slideService.create(slide);
    }

    @Get()
    async findAll(): Promise<Slide[]> {
        return this.slideService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Slide | null> {
        return this.slideService.findOneById(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() update: Partial<Slide>): Promise<Slide | null> {
        return this.slideService.update(id, update);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.slideService.remove(id);
    }
}
