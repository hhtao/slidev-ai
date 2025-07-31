import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Slide } from './slide.entity';
import { User } from '../users/user.entity'
import { CreateSlideDto } from './dto/create-slide.dto';
import { Multer } from 'multer';
import * as fs from 'fs';
import { Observable, interval, from } from 'rxjs';
import { map, takeWhile, concatMap } from 'rxjs/operators';

// 定义文件类型
type MulterFile = Express.Multer.File;

// 定义SSE事件数据结构
interface SSEEvent {
    type: string;
    message: string;
    progress?: number;
    data?: any;
}

@Injectable()
export class SlidesService {
    constructor(
        @InjectRepository(Slide)
        private slidesRepository: Repository<Slide>,
    ) { }

    async createSlide(userId: string, createSlideDto: CreateSlideDto, file?: MulterFile): Promise<Slide> {
        // Generate a unique hash for the preview URL
        const previewHash = uuidv4().replace(/-/g, '').substring(0, 16);

        // Convert outline or file content to Slidev markdown format
        let slidevContent = '';
        if (createSlideDto.outline) {
            slidevContent = this.convertOutlineToSlidev(createSlideDto.outline);
        } else if (file) {
            slidevContent = await this.convertFileToSlidev(file);
        } else {
            slidevContent = this.getDefaultSlidevContent();
        }

        const slide = this.slidesRepository.create({
            title: createSlideDto.title,
            content: slidevContent,
            previewHash,
            userId,
            processingStatus: 'pending'
        });

        return this.slidesRepository.save(slide);
    }

    async getUserSlides(userId: string): Promise<Slide[]> {
        return this.slidesRepository.find({ where: { userId } });
    }

    async getSlideById(id: string): Promise<Slide> {
        const slide = await this.slidesRepository.findOne({ where: { id } });
        if (!slide) {
            throw new NotFoundException(`Slide with ID ${id} not found`);
        }
        return slide;
    }

    async getPublicSlides(skip: number, take: number): Promise<[Slide[], number]> {
        return this.slidesRepository
            .createQueryBuilder('slide')
            .leftJoinAndSelect('slide.user', 'user')
            .select([
                'slide.id',
                'slide.title',
                'slide.previewHash',
                'slide.createdAt',
                'user.username'
            ])
            .skip(skip)
            .take(take)
            .getManyAndCount();
    }

    async getSlideByHash(hash: string): Promise<Slide | null> {
        return this.slidesRepository.findOne({ where: { previewHash: hash } });
    }

    // 处理幻灯片的SSE流
    processSlide(id: string): Observable<any> {
        // 这里返回一个模拟的SSE流，实际开发中应该替换为真实的AI处理逻辑
        return new Observable(observer => {
            // 模拟处理过程
            let progress = 0;

            // 发送初始状态
            observer.next({
                data: JSON.stringify({
                    type: 'progress',
                    message: 'Starting AI processing...',
                    progress: progress
                } as SSEEvent)
            });

            // 模拟处理步骤
            const steps = [
                { message: 'Analyzing content...', progress: 20 },
                { message: 'Generating outline...', progress: 40 },
                { message: 'Creating slides...', progress: 60 },
                { message: 'Optimizing layout...', progress: 80 },
                { message: 'Finalizing...', progress: 90 }
            ];

            let stepIndex = 0;

            const intervalId = setInterval(() => {
                if (stepIndex < steps.length) {
                    const step = steps[stepIndex];
                    observer.next({
                        data: JSON.stringify({
                            type: 'progress',
                            message: step.message,
                            progress: step.progress
                        } as SSEEvent)
                    });
                    stepIndex++;
                } else {
                    // 处理完成
                    observer.next({
                        data: JSON.stringify({
                            type: 'completed',
                            message: 'Processing completed successfully!',
                            progress: 100
                        } as SSEEvent)
                    });

                    // 结束流
                    observer.complete();
                    clearInterval(intervalId);
                }
            }, 1000);

            // 清理函数
            return () => {
                clearInterval(intervalId);
            };
        });
    }

    private async convertFileToSlidev(file: MulterFile): Promise<string> {
        // Read file content
        const fileContent = fs.readFileSync(file.path, 'utf-8');

        // Delete the file after reading
        fs.unlinkSync(file.path);

        // For now, we'll create a simple slide with the file content
        // In a real implementation, you might want to parse the file content more intelligently
        let content = fileContent;

        // If it's a markdown file, we can use it as-is
        if (file.mimetype === 'text/markdown' || file.originalname.endsWith('.md')) {
            return fileContent;
        }

        // For other file types, create a simple slide
        return `---
theme: default
background: https://source.unsplash.com/collection/94734569/1920x1080
---

# ${file.originalname}

---

## File Content

\`\`\`
${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}
\`\`\`

---

## Thank You

Questions?
`;
    }

    private getDefaultSlidevContent(): string {
        return `---
theme: default
background: https://source.unsplash.com/collection/94734569/1920x1080
---

# New Presentation

---

## Introduction

Content here...

---

## Thank You

Questions?
`;
    }

    private convertOutlineToSlidev(outline: string): string {
        // Split outline into lines and filter out empty lines
        const lines = outline.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
            return this.getDefaultSlidevContent();
        }

        // Start building the Slidev markdown
        let slidevMarkdown = `---
theme: default
background: https://source.unsplash.com/collection/94734569/1920x1080
---

`;

        // Add title slide
        slidevMarkdown += `# ${lines[0]}

`;

        // Process the rest of the outline
        let inList = false;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();

            // If line starts with -, treat as bullet point
            if (line.startsWith('-')) {
                // If this is the first list item, start a new slide
                if (!inList) {
                    slidevMarkdown += `---

`;
                    inList = true;
                }
                slidevMarkdown += `${line}\n`;
            }
            // If line ends with :, treat as section header
            else if (line.endsWith(':')) {
                // Close previous list if needed
                if (inList) {
                    inList = false;
                }
                slidevMarkdown += `---

## ${line.slice(0, -1)}

`;
            }
            // Otherwise, treat as content
            else {
                // Close previous list if needed
                if (inList) {
                    inList = false;
                }
                // If this is not an empty line, add as content
                if (line !== '') {
                    slidevMarkdown += `${line}\n\n`;
                }
            }
        }

        // Add closing slide
        slidevMarkdown += `---

## Thank You

Questions?
`;

        return slidevMarkdown;
    }
}