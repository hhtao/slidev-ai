import http from './http';
import { Result } from './base.ts';
import { API_BASE_URL } from '@/utils/api'

export interface LoginDto {
    username: string;
    password: string;
}

export interface RegisterDto {
    username: string;
    email: string;
    password: string;
}

export interface UserDTO {
    id: number;
    username: string;
    email: string;
    avatar?: string | null;
    website?: string | null;
    egoId?: number | null;
}



export async function apiLogin(dto?: LoginDto): Promise<Result<UserDTO>> {
    try {
        const { data, status } = await http.post(`${API_BASE_URL}/auth/login`, dto);
        if (data?.success && data?.user) {
            return { success: true, data: data.user, message: data.message };
        }
        if (typeof data?.error === 'string') {
            return { success: false, error: data.error, status };
        }
        return { success: false, error: data?.message || 'Login failed', status };
    } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message || 'Login failed';
        return { success: false, error: msg, status };
    }
}

export async function apiRegister(dto: RegisterDto): Promise<Result<void>> {
    try {
        const res = await http.post(`${API_BASE_URL}/auth/register`, dto);
        if (res.status >= 200 && res.status < 300) {
            return { success: true, data: undefined };
        }
        return { success: false, error: 'Registration failed', status: res.status };
    } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message || 'Registration failed';
        return { success: false, error: msg, status };
    }
}

export async function apiLogout(): Promise<Result<void>> {
    try {
        await http.post(`${API_BASE_URL}/auth/logout`);
        return { success: true, data: undefined };
    } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message || 'Logout failed';
        return { success: false, error: msg, status };
    }
}
