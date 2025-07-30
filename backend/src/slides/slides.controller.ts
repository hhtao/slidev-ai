import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@Controller('slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

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
  @Post()
  async createSlide(@Request() req: ExpressRequest, @Body() createSlideDto: CreateSlideDto) {
    return this.slidesService.createSlide((req.user as any).id, createSlideDto);
  }

  @Get('preview/:hash')
  async getSlideByHash(@Param('hash') hash: string) {
    return this.slidesService.getSlideByHash(hash);
  }
}