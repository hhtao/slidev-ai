// 知识库PPT生成专用的数据类型定义

export interface KnowledgeSlideRequest {
    title: string;
    topic: string;
    requirements: string;
    targetAudience: string;
    slideCount: number;
    theme: string;
    knowledgeBaseIds?: number[]; // 选中的知识库ID列表
}

export interface KnowledgeSlideOutlineItem {
    title: string;
    content: string;
    keyPoints: string[];
    sourceKnowledge: Array<{
        id: string;
        title: string;
        relevanceScore: number;
    }>;
}

export interface KnowledgeSlideOutline {
    title: string;
    summary: string;
    totalSlides: number;
    slides: KnowledgeSlideOutlineItem[];
    usedKnowledge: Array<{
        id: string;
        title: string;
        contentType: string;
    }>;
}

export interface KnowledgeDocument {
    id: string;
    title: string;
    contentType: string;
    extractedText: string;
    relevanceScore: number;
}

export interface KnowledgePreviewResult {
    totalFound: number;
    documents: KnowledgeDocument[];
}

export interface KnowledgeStats {
    totalDocuments: number;
    vectorizedDocuments: number;
    publicDocuments: number;
}

export type KnowledgeMessageItem = {
    type: 'outline_generation' | 'content_search' | 'markdown_generation' | 'done' | 'error' | 'busy';
    status?: 'pending' | 'done' | 'failed';
    timestamp?: number;
    error?: string;
    message?: string;
    progress?: number;
};

export interface KnowledgeSlidevProject {
    id: string;
    name: string;
    title: string;
    content: string;
    slides_path: string;
    theme: string;
    status: 'generating' | 'ready' | 'error';
}

export interface KnowledgeSlideProcessState {
    stage: 'config' | 'outline' | 'markdown' | 'preview';
    id?: string;
    request?: KnowledgeSlideRequest;
    outline?: KnowledgeSlideOutline;
    project?: KnowledgeSlidevProject;
    isProcessing: boolean;
    error?: string;
}