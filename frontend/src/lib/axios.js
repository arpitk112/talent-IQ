import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Request interceptor to add the Clerk Bearer token
axiosInstance.interceptors.request.use(async (config) => {
    try {
        // Clerk is available globally after it loads
        if (window.Clerk?.session) {
            const token = await window.Clerk.session.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (error) {
        console.error("Error setting Clerk token:", error);
    }
    return config;
});

export default axiosInstance;