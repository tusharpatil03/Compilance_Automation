    import type { User } from "../../../context/AuthContext";
import { setAccessToken } from "../../../hooks/useAxiosPrivate";
import { loginService, type LoginPayload } from "../services/authServices";
import { useAuth } from "./useAuth";

export function useLogin() {
    const { setUser } = useAuth();

    const login = async (loginPayload: LoginPayload): Promise<User> => {
        try {
            const data = await loginService(loginPayload);

            const { accessToken, user } = await data;

            setAccessToken(accessToken);
            setUser(user);

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    return { login };
}

export default useLogin;