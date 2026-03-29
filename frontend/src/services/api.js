import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== 'auth/login/') {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh');
            if (refreshToken) {
                try {
                    const res = await axios.post(`${API_URL}auth/login/refresh/`, { refresh: refreshToken });
                    localStorage.setItem('access', res.data.access);
                    api.defaults.headers.common.Authorization = `Bearer ${res.data.access}`;
                    return api(originalRequest);
                } catch (err) {
                    localStorage.removeItem('access');
                    localStorage.removeItem('refresh');
                    window.location.href = '/login';
                }
            } else {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
