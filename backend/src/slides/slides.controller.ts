import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, UseInterceptors, UploadedFile, Sse } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Observable } from 'rxjs';
import { Multer } from 'multer';
import { CreateSlideDto } from '@/databases/slide/create-slide.dto';
import { SlideRepository } from '@/databases/slide';

// 定义文件类型
type MulterFile = Express.Multer.File;

@Controller('slides')
export class SlidesController {
    constructor(
        private readonly slidesService: SlidesService,
        private slideRepository: SlideRepository,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get(':uid')
    async getSlideById(@Param('uid') uid: string) {
        return this.slideRepository.findOneByUid(uid);
    }


    @UseGuards(JwtAuthGuard)
    @Get()
    async getUserSlides(@Request() req: ExpressRequest) {
        return this.slideRepository.findAllByUserId((req.user as any).id);
    }

    @Get('public')
    async getPublicSlides(
        @Query('skip') skip: number = 0,
        @Query('take') take: number = 10
    ) {
        return this.slideRepository.getPublicSlides(Number(skip) || 0, Number(take) || 10);
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
    @Sse('process/make-outline/:uid')
    makeOutline(@Param('uid') uid: string): Observable<any> {
        return new Observable(subscriber => {
            this.slidesService.makeOutlineHandler(uid, subscriber);
        });
    }


    @UseGuards(JwtAuthGuard)
    @Sse('process/make-markdown/:uid')
    makeMarkdown(@Param('uid') uid: string): Observable<any> {
        return new Observable(subscriber => {
            this.slidesService.makeMarkdownHandler(uid, subscriber);
        });
    }
}