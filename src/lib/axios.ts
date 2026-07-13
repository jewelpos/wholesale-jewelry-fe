import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Create axios instance
const api = axios.create({
  baseURL: typeof window !== "undefined" ? "/api/proxy" : process.env.NEXT_PUBLIC_API_URL,
});

// Store for ongoing refresh token requests
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

async function refreshTokenCall(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
    });
    if (response.ok) {
      return true;
    }
    throw new Error("");
  } catch {
    throw new Error("");
  }
}

async function logout(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });
    if (response.ok) {
      return response.ok;
    }
    throw new Error("");
  } catch {
    throw new Error("");
  }
}

// Response interceptor — handles 401 by attempting a silent token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshTokenCall();
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        await logout();
        if (typeof window !== "undefined") {
          const prefix = window.location.pathname.split("/")[1] || "jw";
          window.location.href = `/${prefix}/login`;
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
