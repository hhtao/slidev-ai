export interface OutlineItem {
    group: string;
    content: string;
}

export interface SlidevProjectSchema {
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

export type MessageItem = {
    type: 'toolcall' | 'toolcalled' | 'done' | 'error' | 'busy';
    name?: string;
    status?: 'pending' | 'done' | 'failed';
    timestamp?: number;
    error?: string;
    message?: string; // for busy or generic messages
};



export interface SlidevDto {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    title: string;
    content: string;
    processingStatus: string;
    visibility: string;
    outlines: string | null;
    slidevName: string | null;
    slidevHome: string | null;
    slidevEntryFile: string | null;
    userId: number;
}