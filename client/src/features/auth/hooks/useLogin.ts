import { axiosClient } from "../../../api/axiosClient";

type LoginPayload = {
    email: string;
    password: string;
}
function useLogin(loginPayload:LoginPayload) {
    try {
        const response = axiosClient.post("/auth/login", loginPayload);
        return response;
    }catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

export default useLogin;