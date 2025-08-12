import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// 可选：统一响应/错误拦截
// http.interceptors.response.use(
//   (res) => res,
//   (error) => Promise.reject(error)
// );

export default http;
