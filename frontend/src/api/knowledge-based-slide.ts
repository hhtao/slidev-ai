import { http } from './http';
import { Result } from './base';

export interface KnowledgeBasedSlideRequest {
    title: string;
    topic: string;
    requirements?: string;
    targetAudience?: string;
    slideCount?: number;
    theme?: string;
    knowledgeBaseIds?: number[]; // 选中的知识库ID列表
}

export interface SlideOutlineItem {
    title: string;
    content: string;
    sourceKnowledge: Array<{
        id: string;
        title: string;
        relevanceScore: number;
    }>;
    keyPoints: string[];
}

export interface KnowledgeBasedSlideOutline {
    title: string;
    summary: string;
    slides: SlideOutlineItem[];
    usedKnowledge: any[];
    totalSlides: number;
}

export interface ContentPreviewRequest {
    query: string;
    limit?: number;
}

export interface ContentPreviewResponse {
    query: string;
    totalFound: number;
    documents: Array<{
        id: number;
        title: string;
        relevanceScore: number;
        extractedText: string;
        contentType: string;
    }>;
}

export interface KnowledgeStats {
    totalDocuments: number;
    documentsByType: Record<string, number>;
    publicDocuments: number;
    privateDocuments: number;
    vectorizedDocuments: number;
}

export const knowledgeBasedSlideApi = {
    // 基于知识库生成PPT大纲
    async generateOutline(request: KnowledgeBasedSlideRequest): Promise<Result<KnowledgeBasedSlideOutline>> {
        const response = await http.post('/knowledge-slides/generate-outline', request);
        return response.data;
    },

    // 基于大纲生成Markdown内容
    async generateMarkdown(request: { outline: any; slideId: string; format: string }): Promise<Result<{ markdown: string; slides_path: string }>> {
        const response = await http.post('/knowledge-slides/generate-markdown', request);
        return response.data;
    },

    // 获取相关文档推荐
    async getRelatedDocuments(slideId: number, limit?: number): Promise<Result<any[]>> {
        const response = await http.get(`/knowledge-slides/related-documents/${slideId}`, {
            params: { limit }
        });
        return response.data;
    },

    // 预览基于知识库的内容
    async previewContent(request: ContentPreviewRequest): Promise<Result<ContentPreviewResponse>> {
        const response = await http.post('/knowledge-slides/preview-content', request);
        return response.data;
    },

    // 获取知识库统计信息
    async getKnowledgeStats(): Promise<Result<KnowledgeStats>> {
        const response = await http.get('/knowledge-slides/knowledge-stats');
        return response.data;
    },
};