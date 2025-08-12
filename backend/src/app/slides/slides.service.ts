import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Observable, Subscriber } from 'rxjs';

import { OmAgent } from 'openmcp-sdk/service/sdk';
import { SlidevMcpService } from '@/app/mcp/slidev-mcp.service';
import { SlideRepository } from './slide.repository';
import { CreateSlideDto} from './slide.dto';
import { Slide } from './slide.entity';

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

## 输出
请使用 markdown 格式生成幻灯片的大纲，请勿输出其他内容。
`;
    }

    /**
     * @description 创建 outline 任务，并返回中途进度
     */
    async makeOutlineHandler(id: number, subscriber: Subscriber<any>) {
        const slide = await this.slidesRepository.findOneById(id);

        if (!slide) {
            subscriber.next({ type: 'error', message: 'Slide not found' });
            subscriber.complete();
            return;
        }

        const { agent, loop } = await this.getAgentDependency();

        loop.registerOnToolCall(toolcall => {
            subscriber.next({
                type: 'toolcall',
                toolcall,
            });
            return toolcall;
        });

        loop.registerOnToolCalled(toolcalled => {
            subscriber.next({
                type: 'toolcalled',
                data: toolcalled
            });
            return toolcalled;
        });

        const usermcpPrompt = await agent.getPrompt('usermcp_guide_prompt', {});
        const slidevPrompt = await agent.getPrompt('guide_prompt', {});

        const prompts = [
            usermcpPrompt,
            slidevPrompt,
            this.makeOutlinePrompt(slide)
        ];

        await agent.ainvoke({ messages : prompts.join('\n\n') });
    }

    /**
     * @description 创建 markdown 任务，并返回中途进度
     */
    async makeMarkdownHandler(id: string, subscriber: Subscriber<any>) {
        const { agent, loop } = await this.getAgentDependency();

        loop.registerOnToolCall(toolcall => {

            return toolcall;
        });

        loop.registerOnToolCalled(toolcalled => {
            

            return toolcalled;
        });

        subscriber.next('');
    }

}