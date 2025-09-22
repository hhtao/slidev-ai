import http from './http';
import { Result } from './base';

export interface Knowledge {
    id: number;
    createdAt: string;
    updatedAt: string;
    title: string;
    content: string;
    summary?: string;
    filename?: string;
    fileSize: number;
    contentType: string;
    vectorStatus: 'pending' | 'processing' | 'completed' | 'failed';
    visibility: 'public' | 'private';
    metadata?: any;
    userId: number;
    user?: {
        id: number;
        username: string;
        email: string;
    };
}

export interface CreateKnowledgeDto {
    title: string;
    content: string;
    summary?: string;
    contentType?: string;
    visibility?: 'public' | 'private';
    metadata?: any;
}

export interface UpdateKnowledgeDto {
    title?: string;
    content?: string;
    summary?: string;
    visibility?: 'public' | 'private';
    metadata?: any;
}

export interface KnowledgeSearchParams {
    keyword?: string;
    contentType?: string;
    visibility?: string;
    page?: number;
    limit?: number;
}

export interface KnowledgeListResponse {
    knowledge: Knowledge[];
    total: number;
    page: number;
    limit: number;
}

export const knowledgeApi = {
    // 创建知识文档
    async create(data: CreateKnowledgeDto): Promise<Result<Knowledge>> {
        return await http.post('/knowledge', data);
    },

    // 上传文件创建知识文档
    async uploadFile(file: File, metadata?: any): Promise<Result<Knowledge>> {
        console.log('开始上传文件 API 调用:', file.name);
        const formData = new FormData();
        formData.append('file', file);
        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        console.log('FormData 已准备好, 发送请求到:', '/knowledge/upload');
        
        try {
            const result = await http.post('/knowledge/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('上传响应:', result.data);
            return result.data;
        } catch (error) {
            console.error('上传请求失败:', error);
            throw error;
        }
    },

    // 获取知识文档列表
    async getList(params?: KnowledgeSearchParams): Promise<Result<KnowledgeListResponse>> {
        return await http.get('/knowledge', { params });
    },

    // 获取公开知识文档列表
    async getPublicList(params?: KnowledgeSearchParams): Promise<Result<KnowledgeListResponse>> {
        return await http.get('/knowledge/public', { params });
    },

    // 获取单个知识文档
    async getById(id: number): Promise<Result<Knowledge>> {
        return await http.get(`/knowledge/${id}`);
    },

    // 更新知识文档
    async update(id: number, data: UpdateKnowledgeDto): Promise<Result<Knowledge>> {
        return await http.patch(`/knowledge/${id}`, data);
    },

    // 删除知识文档
    async delete(id: number): Promise<Result<{ message: string }>> {
        return await http.delete(`/knowledge/${id}`);
    },

    // 向量相似性搜索
    async searchSimilar(query: string, limit?: number): Promise<Result<Knowledge[]>> {
        return await http.get('/knowledge/search', {
            params: { query, limit }
        });
    },

    // 获取知识文档内容
    async getContent(id: number): Promise<Result<{ content: string }>> {
        return await http.get(`/knowledge/${id}/content`);
    },

    // 下载知识文档
    async download(id: number): Promise<any> {
        return await http.get(`/knowledge/${id}/download`, {
            responseType: 'blob'
        });
    },

    // 批量删除知识文档
    async batchDelete(ids: number[]): Promise<Result<{ message: string }>> {
        return await http.delete('/knowledge/batch', {
            data: { ids }
        });
    },

    // 上传多个文件
    async upload(formData: FormData): Promise<Result<any>> {
        return await http.post('/knowledge/upload-multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // 获取文档处理状态
    async getStatus(id: number): Promise<Result<{ processingStatus: string; processingProgress?: number; processingStage?: string; processingError?: string }>> {
        return await http.get(`/knowledge/${id}/status`);
    },
};