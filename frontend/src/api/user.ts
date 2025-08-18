import http from './http';
import type { Result } from './base';
import type { UserDTO } from './auth';
import { API_BASE_URL } from '@/utils/api'

export interface UpdateProfilePayload {
  email?: string;
  avatar?: File; // will be sent as multipart
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

export async function apiUpdateMe(payload: UpdateProfilePayload): Promise<Result<UserDTO>> {
  try {
    const form = new FormData();
    if (payload.email) form.append('email', payload.email);
    if (payload.avatar) form.append('avatar', payload.avatar);
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
