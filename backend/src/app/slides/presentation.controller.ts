import { Controller, Get, Param, Res, Req, NotFoundException } from '@nestjs/common';
import { Response, Request } from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { SlideRepository } from './slide.repository';

@Controller('presentation')
export class SlidesPresentationController {
    constructor(
        private readonly slideRepository: SlideRepository,
    ) { }

    // 匹配 /api/slides/presentation/:id/* 的所有子路径
    @Get(':id/*paths')
    async getPresentation(
        @Param('id') id: number,
        @Param('paths') paths: string[],
        @Req() req: Request,
        @Res() res: Response,
    ) {
        
        // 拼接动态路径
        const filePath = join(
            process.cwd(),
            'presentation',
            id.toString(),
            ...paths,
        );        

        // 文件存在性检查
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Not found');
        }

        // 返回文件
        res.sendFile(filePath);
    }

    // 可选：匹配仅访问 /api/slides/presentation/:id
    @Get(':id')
    async getPresentationIndex(
        @Param('id') id: number,
        @Res() res: Response,
    ) {
        const filePath = join(
            process.cwd(),
            'presentation',
            id.toString(),
            'index.html'
        );

        res.sendFile(filePath);
    }
}
