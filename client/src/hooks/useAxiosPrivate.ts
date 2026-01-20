//use private axios instance with interceptors to attach access token to request headers
import axios from 'axios';
import { getFromLocalStorage } from '../utils/storage';

export const axiosProtected = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosProtected.interceptors.request.use(
    (config) => {
        const token = getFromLocalStorage('access_token');
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
)