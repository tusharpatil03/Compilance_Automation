import { setAccessToken } from "../../../hooks/useAxiosPrivate";
import { useAuth } from "./useAuth";

export function useLogout() {
    const { setUser } = useAuth();
    const logout = () => {
        // Clear access token
        setAccessToken(null);
        setUser(null);
    };

    return { logout };
}

export default useLogout;