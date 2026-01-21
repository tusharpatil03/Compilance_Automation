import { axiosClient } from "../../../api/axiosClient";

export type LoginPayload = {
    email: string;
    password: string;
}


async function loginService(payload: LoginPayload){
    try{
        const response = await axiosClient.post('/auth/login', payload);
        
        return response.data;
    }catch(error){
        console.error('Login error:', error);
        throw error;
    }
}

export type RegisterPayload = {
    email: string;
    password: string;
    role: "admin" | "user";
}

const registerService = async (payload: RegisterPayload) => {
    try {
        const response = await axiosClient.post('/auth/register', payload);
        return response.data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

export {loginService, registerService};