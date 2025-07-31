import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, UseInterceptors, UploadedFile, Sse } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Observable } from 'rxjs';
import { Multer } from 'multer';

// 定义文件类型
type MulterFile = Express.Multer.File;

@Controller('slides')
export class SlidesController {
    constructor(private readonly slidesService: SlidesService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getUserSlides(@Request() req: ExpressRequest) {
        return this.slidesService.getUserSlides((req.user as any).id);
    }

    @Get('public')
    async getPublicSlides(
        @Query('skip') skip: number = 0,
        @Query('take') take: number = 10
    ) {
        return this.slidesService.getPublicSlides(Number(skip) || 0, Number(take) || 10);
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, callback) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
                    callback(null, filename);
                },
            }),
        }),
    )
    @Post()
    async createSlide(
        @Request() req: ExpressRequest,
        @Body() createSlideDto: CreateSlideDto,
        @UploadedFile() file: MulterFile
    ) {
        return this.slidesService.createSlide((req.user as any).id, createSlideDto, file);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getSlideById(@Param('id') id: string) {
        return this.slidesService.getSlideById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Sse(':id/process')
    processSlide(@Param('id') id: string): Observable<any> {
        return this.slidesService.processSlide(id);
    }

    @Get('preview/:hash')
    async getSlideByHash(@Param('hash') hash: string) {
        return this.slidesService.getSlideByHash(hash);
    }
}