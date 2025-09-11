import axios from 'axios';
import type { Result } from './base';
import { API_BASE_URL } from '@/utils/api';

export interface InvitationDTO {
    id: number;
    code: string;
    createdAt: string;
}

export interface PaginatedInvitationsDTO {
    invitations: InvitationDTO[];
    total: number;
    page: number;
    limit: number;
}

export const apiGetInvitations = async (page: number = 1, limit: number = 20): Promise<Result<PaginatedInvitationsDTO>> => {
    try {
        const res = await axios.get(`${API_BASE_URL}/invitations`, {
            params: { page, limit },
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return { success: true, data: res.data };
    } catch (err: any) {
        return { success: false, status: err?.response?.status, error: err?.response?.data?.message || 'Unknown error' };
    }
};

export const apiCreateInvitation = async (code?: string): Promise<Result<InvitationDTO>> => {
    try {
        const res = await axios.post(`${API_BASE_URL}/invitations`, { code }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return { success: true, data: res.data };
    } catch (err: any) {
        return { success: false, status: err?.response?.status, error: err?.response?.data?.message || 'Unknown error' };
    }
};

export const apiDeleteInvitation = async (id: number): Promise<Result<void>> => {
    try {
        await axios.delete(`${API_BASE_URL}/invitations/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return { success: true, data: undefined };
    } catch (err: any) {
        return { success: false, status: err?.response?.status, error: err?.response?.data?.message || 'Unknown error' };
    }
};