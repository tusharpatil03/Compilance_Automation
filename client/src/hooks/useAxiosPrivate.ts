//use private axios instance with interceptors to attach access token to request headers
import axios from 'axios';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const isAuthenticated = (): boolean => {
    return accessToken !== null;
};

export const axiosProtected = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosProtected.interceptors.request.use(
    (config) => {
        if (accessToken && config.headers) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
)