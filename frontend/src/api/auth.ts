import axios from 'axios';
import type { Result } from './base';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface UserDTO {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    role: 'user' | 'admin';
    createdAt: string;
    updatedAt: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    invitationCode: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export const apiRegister = async (payload: RegisterPayload): Promise<Result<UserDTO>> => {
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/register`, payload);
        return { success: true, data: res.data };
    } catch (err: any) {
        return { success: false, status: err?.response?.status, error: err?.response?.data?.message || 'Unknown error' };
    }
};

export const apiLogin = async (payload?: LoginPayload): Promise<Result<UserDTO>> => {
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, payload);
        return { success: true, data: res.data };
    } catch (err: any) {
        return { success: false, status: err?.response?.status, error: err?.response?.data?.message || 'Unknown error' };
    }
};

export const apiLogout = async (): Promise<Result<void>> => {
    try {
        await axios.post(`${API_BASE_URL}/auth/logout`);
        return { success: true, data: undefined };
    } catch (err: any) {
        return { success: false, status: err?.response?.status, error: err?.response?.data?.message || 'Unknown error' };
    }
};
