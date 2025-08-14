import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Observable, Subscriber } from 'rxjs';

import { OmAgent } from 'openmcp-sdk/service/sdk';
import { SlidevMcpService } from '@/app/mcp/slidev-mcp.service';
import { SlideRepository } from './slide.repository';
import { CreateSlideDto } from './slide.dto';
import { Slide } from './slide.entity';
import { toSseData } from '@/utils/sse';

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
    ) { }

    /**
     * @description 创建给定素材的幻灯片项目，并塞入数据库
     */
    async createSlide(userId: string, createSlideDto: CreateSlideDto, file?: MulterFile): Promise<Slide> {
        // TODO: 解析文件 file 并进入数据库

        return this.slidesRepository.create({
            title: createSlideDto.title,
            content: createSlideDto.content,
            visibility: createSlideDto.visibility,
            userId,
            processingStatus: 'pending'
        });
    }

    async getAgentDependency() {
        const configurationPath = this.slidevMcpService.generateOpenMcpConfig();
        const agent = new OmAgent();
        agent.loadMcpConfig(configurationPath);
        const loop = await agent.getLoop();
        return { agent, loop };
    }

    makeOutlinePrompt(slide: Slide) {
        return `
## 标题
${slide.title}

## 内容
${slide.content}

请帮我制作 slidev ppt 的大纲。
`;
    }

    /**
     * 保存幻灯片的大纲数据
     */
    async saveOutlines(id: number, userId: string, outlines: any): Promise<void> {
        const slide = await this.slidesRepository.findOneById(id);
        
        if (!slide) {
            throw new Error('Slide not found');
        }
        
        if (slide.userId !== userId) {
            throw new Error('Unauthorized');
        }
        
        // 将outlines对象转换为JSON字符串存储
        await this.slidesRepository.update(id, { outlines: JSON.stringify(outlines) });
    }

    /**
     * 检查幻灯片是否已经生成了大纲
     */
    async hasOutlines(id: number, userId: string): Promise<boolean> {
        const slide = await this.slidesRepository.findOneById(id);
        
        if (!slide) {
            throw new Error('Slide not found');
        }
        
        if (slide.userId !== userId && slide.visibility !== 'public') {
            throw new Error('Unauthorized');
        }
        
        return !!slide.outlines;
    }

    /**
     * @description 创建 outline 任务，并返回中途进度
     */
    async makeOutlineHandler(id: number, subscriber: Subscriber<any>) {
        const slide = await this.slidesRepository.findOneById(id);

        if (!slide) {
            subscriber.next(toSseData({ type: 'error', message: 'Slide not found' }));
            subscriber.complete();
            return;
        }

        const { agent, loop } = await this.getAgentDependency();

        const saveOutlineIds = new Set();

        loop.registerOnToolCall(toolcall => {
            subscriber.next(toSseData({
                type: 'toolcall',
                toolcall,
            }));

            if (toolcall.function.name === 'slidev_save_outline') {
                saveOutlineIds.add(toolcall.id);
            }
            
            return toolcall;
        });

        loop.registerOnToolCalled(toolcalled => {

            if (saveOutlineIds.has(toolcalled.id)) {
                loop.abort();
            }
            
            subscriber.next(toSseData({
                type: 'toolcalled',
                toolcalled,
            }));

            return toolcalled;
        });

        loop.registerOnError(error => {
            subscriber.next(toSseData({ error }));
            console.log('error', error);
        });

        const usermcpPrompt = await agent.getPrompt('usermcp_guide_prompt', {});
        const outlinePrompt = await agent.getPrompt('outline_generate_prompt', {});

        const prompts = [
            usermcpPrompt,
            outlinePrompt,
            this.makeOutlinePrompt(slide)
        ];

        await agent.ainvoke({ messages: prompts.join('\n\n') });

        subscriber.next(toSseData({ done: true }));
    }

    /**
     * @description 创建 markdown 任务，并返回中途进度
     */
    async makeMarkdownHandler(id: string, subscriber: Subscriber<any>) {
        const { agent, loop } = await this.getAgentDependency();

        loop.registerOnToolCall(toolcall => {
            subscriber.next(toSseData({
                type: 'toolcall',
                toolcall,
            }));

            return toolcall;
        });

        loop.registerOnToolCalled(toolcalled => {

            subscriber.next(toSseData({
                type: 'toolcalled',
                toolcalled,
            }));
            return toolcalled;
        });

        subscriber.next('');
    }

}