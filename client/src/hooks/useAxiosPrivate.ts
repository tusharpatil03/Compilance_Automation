//use private axios instance with interceptors to attach access token to request headers
import axios from 'axios';
import { getFromLocalStorage } from '../utils/storage';

export const axiosProtected = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor to add auth token
axiosProtected.interceptors.request.use(
    (config) => {
        const token = getFromLocalStorage<string>('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling common errors
axiosProtected.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('auth_token');
            localStorage.removeItem('tenant_data');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
