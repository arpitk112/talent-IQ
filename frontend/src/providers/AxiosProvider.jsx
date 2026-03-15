import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import axiosInstance from "./axios";

export default function AxiosProvider({ children }) {
    const { getToken } = useAuth();

    useEffect(() => {
        const interceptor = axiosInstance.interceptors.request.use(
            async (config) => {
                const token = await getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return () => {
            axiosInstance.interceptors.request.eject(interceptor);
        };
    }, [getToken]);

    return children;
}
