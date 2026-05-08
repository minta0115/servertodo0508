import axios from 'axios';

const api = axios.create({
    // 如果有 VITE_API_BASE 且非空，使用它；否则使用相对路径
    baseURL: import.meta.env.VITE_API_BASE
        ? import.meta.env.VITE_API_BASE.replace(/\/$/, '') + '/api'
        : '/api',
});

export default api;
