import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken } from "./authStorage";

// Create axios instance
const api = axios.create({
  baseURL: typeof window !== "undefined" ? "/api/proxy" : process.env.NEXT_PUBLIC_API_URL,
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

// Store for ongoing refresh token requests
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

async function refreshTokenCall(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh-token", {
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

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from storage
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        await refreshTokenCall(); // Process queued requests
        processQueue(null, "");

        // Return original request with new token
        return api(originalRequest);
      } catch (refreshError) {
        // Handle refresh token failure
        processQueue(refreshError as Error);

        // Clear tokens and redirect to login
        await logout();

        // If we're in the browser environment, redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/jw/login";
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
