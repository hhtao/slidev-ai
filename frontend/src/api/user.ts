import http from './http';
import type { Result } from './base';
import type { UserDTO } from './auth';
import { API_BASE_URL } from '@/utils/api'

export interface UpdateProfilePayload {
    email?: string;
    avatar?: File; // will be sent as multipart
    website?: string;
    egoId?: number;
}

export async function apiGetMe(): Promise<Result<UserDTO>> {
    try {
        const { data, status } = await http.get(`${API_BASE_URL}/users/me`);
        if (data && data.id) {
            return { success: true, data };
        }
        return { success: false, error: 'Failed to fetch user', status };
    } catch (e: any) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.message || e.message;
        return { success: false, error: msg, status };
    }
}

// 获取指定用户（用于查看其它用户资料）
export async function apiGetUser(id: number | string): Promise<Result<UserDTO>> {
    try {
        const { data, status } = await http.get(`${API_BASE_URL}/users/${id}`);
        if (data && data.id) {
            return { success: true, data };
        }
        return { success: false, error: 'Failed to fetch user', status };
    } catch (e: any) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.message || e.message;
        return { success: false, error: msg, status };
    }
}

export async function apiUpdateMe(payload: UpdateProfilePayload): Promise<Result<UserDTO>> {
    try {
        const form = new FormData();
        if (payload.email) {
            form.append('email', payload.email);
        }

        if (payload.website) {
            form.append('website', payload.website);
        }

        if (payload.egoId) {
            form.append('egoId', payload.egoId.toString());
        }

        if (payload.avatar) {
            form.append('avatar', payload.avatar);
        }
        const { data, status } = await http.patch(`${API_BASE_URL}/users/me`, form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (data && data.id) return { success: true, data };
        return { success: false, error: 'Update failed', status };
    } catch (e: any) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.message || e.message;
        return { success: false, error: msg, status };
    }
}
