import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Multer } from 'multer';
import * as fs from 'fs';
import { Observable, interval, from } from 'rxjs';
import { map, takeWhile, concatMap } from 'rxjs/operators';
import { Slide } from '@/databases/slide/slide.dto';
import { CreateSlideDto } from '@/databases/slide/create-slide.dto';

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

    /**
     * @description 创建给定素材的幻灯片项目，并塞入数据库
     */
    async createSlide(userId: string, createSlideDto: CreateSlideDto, file?: MulterFile): Promise<Slide> {
        // Generate a unique hash for the preview URL
        const uid = uuidv4().replace(/-/g, '').substring(0, 16);
        
        // TODO: 解析文件 file 并进入数据库

        const slide = this.slidesRepository.create({
            title: createSlideDto.title,
            content: createSlideDto.outline,
            uid,
            userId,
            processingStatus: 'pending'
        });

        return this.slidesRepository.save(slide);
    }

    async getUserSlides(userId: string): Promise<Slide[]> {
        return this.slidesRepository.find({ where: { userId } });
    }

    async getSlideByUid(id: string): Promise<Slide> {
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
                'slide.uid',
                'slide.createdAt',
                'user.username'
            ])
            .skip(skip)
            .take(take)
            .getManyAndCount();
    }

    makeSlidevOutline(uid: string): Observable<any> {
        return new Observable<any>(subscriber => {
            
            subscriber.next('');
        })
    }

    async getSlideByHash(hash: string): Promise<Slide | null> {
        return this.slidesRepository.findOne({ where: { uid: hash } });
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

}