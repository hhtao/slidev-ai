import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Observable, Subscriber } from 'rxjs';

import { OmAgent } from 'openmcp-sdk/service/sdk';
import { SlidevMcpService } from '@/mcp/slidev-mcp.service';
import { InjectRepository } from '@nestjs/typeorm';
import { SlideRepository } from '@/databases/repository/slide';
import { CreateSlideDto, Slide } from '@/databases/dto/slide';

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
        @InjectRepository(SlideRepository)
        private readonly slidesRepository: SlideRepository,
        private readonly slidevMcpService: SlidevMcpService,
    ) { }

    /**
     * @description 创建给定素材的幻灯片项目，并塞入数据库
     */
    async createSlide(userId: string, createSlideDto: CreateSlideDto, file?: MulterFile): Promise<Slide> {
        const uid = uuidv4().replace(/-/g, '').substring(0, 16);

        // TODO: 解析文件 file 并进入数据库

        return this.slidesRepository.create({
            title: createSlideDto.title,
            content: createSlideDto.outline,
            uid,
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

    /**
     * @description 创建 outline 任务，并返回中途进度
     */
    async makeOutlineHandler(uid: string, subscriber: Subscriber<any>) {
        const { agent, loop } = await this.getAgentDependency();

        loop.registerOnToolCall(toolcall => {

            return toolcall;
        });

        loop.registerOnToolCalled(toolcalled => {
            

            return toolcalled;
        });


        subscriber.next('');
    }

    /**
     * @description 创建 markdown 任务，并返回中途进度
     */
    async makeMarkdownHandler(uid: string, subscriber: Subscriber<any>) {
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