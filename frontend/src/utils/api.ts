import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
export const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://localhost:3001/uploads';
export const PREVIEW_URL = import.meta.env.VITE_PREVIEW_URL || 'http://localhost';
axios.defaults.withCredentials = true;