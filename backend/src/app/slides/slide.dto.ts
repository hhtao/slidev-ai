import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateSlideDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    content!: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['public', 'private'])
    visibility!: 'public' | 'private';

    @IsString()
    @IsNotEmpty()
    theme!: string;
}


export interface OutlinesDto {
    outlines: any;
}

export type ProcessingStatus = 'pending' | 'user-input-saved' | 'outline-saved' | 'markdown-saved' | 'completed'

// 定义 slidesPath 数据结构
export interface SlidevProjectDto {
    /**
     * @example "test2"
     */
    name: string;
    /**
     * @example ".slidev-mcp/test2"
     */
    home: string;
    /**
     * @example ".slidev-mcp/test2/slides.md"
     */
    slides_path: string;
}