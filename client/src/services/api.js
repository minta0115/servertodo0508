import axios from 'axios';

const getBaseURL = () => {
    if (import.meta.env.VITE_API_BASE) {
        return import.meta.env.VITE_API_BASE;
    }
    // 使用相对路径，同源部署
    return '';
};

const api = axios.create({
    baseURL: getBaseURL() + '/api',
});

export default api;
