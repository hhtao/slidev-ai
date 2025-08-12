// stores/auth.ts
import { API_BASE_URL } from '@/utils/api'
import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UserDTO {
    username: string;
    email: string;
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserDTO | null>(null);
    const login = async (credentials?: { username: string; password: string }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)
            if (response.data.success) {
                user.value = response.data.user
                return response;
            }
            return response;
        } catch (error) {
            console.error('Login failed:', error)
            return { data: { success: false, message: 'Login failed', user: null } };
        }
    }

    const register = async (userData: { username: string; email: string; password: string }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData)
            if (response.data.success) {
                user.value = response.data.user
                return true;
            }
            return false;
        } catch (error) {
            console.error('Registration failed:', error);
            return false;
        }
    }

    const logout = async () => {
        user.value = null;
        await axios.post(`${API_BASE_URL}/auth/logout`);
    }

    return { user, login, register, logout }
})