import { APILayer } from "./APILayer";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const apiClient = new APILayer(BASE_URL);
