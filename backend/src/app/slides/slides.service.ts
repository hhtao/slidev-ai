import { Injectable } from '@nestjs/common';
import { Observable, Subscriber } from 'rxjs';

import { OmAgent } from 'openmcp-sdk/service/sdk';
import { SlidevMcpService } from '@/app/mcp/slidev-mcp.service';
import { SlideRepository } from './slide.repository';
import { CreateSlideDto, SlidevProjectDto } from './slide.dto';
import { Slide } from './slide.entity';
import { toSseData } from '@/utils/sse';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SLIDEV_MCP_ROOT } from '@/constant/filepath';
import { SlideLockService } from './slide-lock.service';
import BaseResponse from '@/app/base/base.dto';
import  STATUS_CODE  from '@/constant/status-code';
import { SlidevManagerService } from './slidev-manager.service';
import { User } from '../users/user.entity';
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
        private readonly slidesRepository: SlideRepository,
        private readonly slidevMcpService: SlidevMcpService,
        private readonly slideLock: SlideLockService,
        private readonly slidevManager: SlidevManagerService,

    ) { }

    /**
     * @description 创建给定素材的幻灯片项目，并塞入数据库
     */
    async createSlide(userId: string, createSlideDto: CreateSlideDto, file?: MulterFile): Promise<Slide> {
        // TODO: 解析文件 file 并进入数据库
        const filePath = uuidv4()
        return this.slidesRepository.create({
            title: createSlideDto.title,
            content: createSlideDto.content,
            visibility: createSlideDto.visibility,
            theme: createSlideDto.theme,
            userId,
            processingStatus: 'pending'
        });
    }

    async saveSlide(id: number, createSlideDto: CreateSlideDto, file?: MulterFile) {

        await this.slidesRepository.update(id, {
            title: createSlideDto.title,
            content: createSlideDto.content,
            visibility: createSlideDto.visibility,
            theme: createSlideDto.theme,
            processingStatus: 'user-input-saved'
        });

        return { success: true };
    }

    async getAgentDependency(slide: Slide) {
        const configurationPath = this.slidevMcpService.generateOpenMcpConfig(slide);
        const agent = new OmAgent();
        agent.loadMcpConfig(configurationPath);
        const loop = await agent.getLoop();
        return { agent, loop };
    }

    /**
     * 保存幻灯片的 slides_path
     */
    async saveSlidesPath(id: number, slidevData: SlidevProjectDto) {
        // 这里应使用传入的 home 字段（而不是 name）作为 slidevHome
        await this.slidesRepository.update(id, {
            slidevName: slidevData.name,
            slidevHome: slidevData.name,
            processingStatus: 'markdown-saved',
        });
        return { success: true };
    }

    /**
     * 保存幻灯片的大纲数据
     */
    async saveOutlines(id: number, outlines: any) {
        this.slidesRepository.update(id, {
            outlines: JSON.stringify(outlines),
            processingStatus: 'outline-saved',
        });
        return { success: true }
    }

    /**
     * 检查幻灯片是否已经生成了大纲
     */
    async hasOutlines(id: number): Promise<boolean> {
        const slide = await this.slidesRepository.findOneById(id);

        if (!slide) {
            throw new Error('幻灯片不存在');
        }

        return !!slide.outlines;
    }

    private async runSseWithLock(id: number, operation: string, subscriber: Subscriber<any>, core: () => Promise<void>) {
        try {
            await this.slideLock.withLock(id, operation, async () => {
                try {
                    await core();
                } catch (inner) {
                    throw inner;
                }
            });
        } catch (e: any) {
            if (e.code === 'SLIDE_BUSY') {
                subscriber.next(toSseData({
                    type: 'busy',
                    message: `当前幻灯片正在执行 ${e.current?.operation}`,
                    current: e.current,
                }));
            } else {
                subscriber.next(toSseData({ type: 'error', message: e.message }));
            }
        } finally {
            subscriber.complete();
        }
    }

    /** 创建 outline 任务（带锁） */
    async makeOutlineHandler(id: number, user: User, subscriber: Subscriber<any>) {
        await this.runSseWithLock(id, 'make-outline', subscriber, async () => {
            const slide = await this.slidesRepository.findOneById(id);
            if (!slide) {
                subscriber.next(toSseData({ type: 'error', message: 'Slide not found' }));
                return;
            }

            const { agent, loop } = await this.getAgentDependency(slide);
            const saveOutlineIds = new Set();
            
            loop.registerOnToolCall(toolcall => {
                subscriber.next(toSseData({ type: 'toolcall', toolcall }));
                if (toolcall.function.name === 'slidev_save_outline') {
                    saveOutlineIds.add(toolcall.id);
                }
                return toolcall;
            });
            
            loop.registerOnToolCalled(toolcalled => {
                if (saveOutlineIds.has(toolcalled.id)) {
                    loop.abort();
                }
                subscriber.next(toSseData({ type: 'toolcalled', toolcalled }));
                return toolcalled;
            });
            
            loop.registerOnError(error => {
                subscriber.next(toSseData({ error }));
                console.log('error', error);
            });
            
            const usermcpPrompt = await agent.getPrompt('usermcp_guide_prompt', {});
            const outlinePrompt = await agent.getPrompt('outline_generate_prompt', {
                title: slide.title,
                content: slide.content
            });
            const userInfoPrompt = await agent.getPrompt('slidev_user_info', {
                username: user.username,
                email: user.email,
                // avatar: user.avatar,
                // egoId: user.egoId,
                website: user.website,
            });

            await agent.ainvoke({ messages: [usermcpPrompt, outlinePrompt, userInfoPrompt].join('\n\n') });
            subscriber.next(toSseData({ done: true }));
        });
    }

    /**
     * @description 创建 markdown 任务，并返回中途进度
     */
    async makeMarkdownHandler(id: number, user: User, subscriber: Subscriber<any>) {
        await this.runSseWithLock(id, 'make-markdown', subscriber, async () => {            
            const slide = await this.slidesRepository.findOneById(id);
            if (!slide) {
                subscriber.next(toSseData({ type: 'error', message: 'Slide not found' }));
                return;
            }

            const { agent, loop } = await this.getAgentDependency(slide);

            const outlines = slide.outlines || '';
            if (outlines.length === 0) {
                subscriber.next(toSseData({ type: 'message', message: 'Outline not found' }));
                return;
            }
            const saveOutlineIds = new Set();
            loop.registerOnToolCall(toolcall => {
                subscriber.next(toSseData({ type: 'toolcall', toolcall }));
                if (toolcall.function.name === 'slidev_export_project') {
                    saveOutlineIds.add(toolcall.id);
                }
                return toolcall;
            });
            loop.registerOnToolCalled(toolcalled => {
                if (saveOutlineIds.has(toolcalled.id)) {
                    // 异步持久化，不阻塞返回类型
                    (async () => {
                        try {
                            const raw = toolcalled?.content?.[0]?.text;
                            if (typeof raw === 'string') {
                                const parsed: any = JSON.parse(raw);
                                if (parsed && parsed.name) {
                                    await this.slidesRepository.update(id, {
                                        slidevName: parsed.name,
                                        slidevHome: parsed.home ?? parsed.name,
                                        processingStatus: 'markdown-saved'
                                    });
                                }
                            }
                        } catch (e) {
                            console.warn('Failed to persist slidev export metadata:', e);
                        }
                    })();
                    loop.abort();
                }
                subscriber.next(toSseData({ type: 'toolcalled', toolcalled }));
                return toolcalled;
            });
            const usermcpPrompt = await agent.getPrompt('usermcp_guide_prompt', {});
            let slidevHome = slide.slidevHome;
            if (!slidevHome || slidevHome.length === 0) {
                slidevHome = uuidv4();
            }
            
            const slidevPrompt = await agent.getPrompt('slidev_generate_with_specific_outlines_prompt', { outlines, title: slide.title, content: slide.content, path: slidevHome });
            const userInfoPrompt = await agent.getPrompt('slidev_user_info', {
                username: user.username,
                email: user.email,
                // avatar: user.avatar,
                // egoId: user.egoId,
                website: user.website,
            });
            
            await agent.ainvoke({ messages: [usermcpPrompt, slidevPrompt, userInfoPrompt].join('\n\n') });
            subscriber.next(toSseData({ done: true }));
        });
    }


    getSlidePrjAbsolutePath(slide: Slide): string | null {

        const slidePath = path.join(SLIDEV_MCP_ROOT, slide.slidevHome, "slides.md");
        if (!slidePath) {
            return null;
        }

        return slidePath;
    }
    async buildSlidevProject(id:number): Promise<BaseResponse> {
        try {
            await this.slideLock.withLock(id, 'build-slidev', async () => {
                const slide = await this.slidesRepository.findOneById(id);
                if (!slide) {
                    throw new Error('NOT_FOUND:Slide not found');
                }
                const absolutePath = this.getSlidePrjAbsolutePath(slide);
                if (!absolutePath) {
                    throw new Error('NOT_FOUND:Slide project path not found');
                }
                this.slidesRepository.update(id, { processingStatus: 'markdown-saved' });
                const screenshotPath = await this.slidevManager.captureScreenshot(id, absolutePath, slide);
                if (screenshotPath) {
                    this.slidesRepository.update(id, { coverFilename: path.basename(screenshotPath) });
                }
                await this.slidevManager.buildSlidevProject(id, absolutePath);
                this.slidesRepository.update(id, { processingStatus: 'completed' });
            });
            return BaseResponse.success();
        } catch (e: any) {
            if (e.code === 'SLIDE_BUSY') {
                return BaseResponse.error(STATUS_CODE.BAD_REQUEST, `Slide busy: running ${e.current?.operation}`);
            }
            if (typeof e.message === 'string' && e.message.startsWith('NOT_FOUND:')) {
                return BaseResponse.error(STATUS_CODE.NOT_FOUND, e.message.split(':')[1]);
            }
            return BaseResponse.error(STATUS_CODE.INTERNAL_SERVER_ERROR, e.message || 'Unknown error');
        }
    }
}