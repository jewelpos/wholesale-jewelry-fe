import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { refreshToken as sharedRefreshToken } from "@/lib/graphql/errorLinks";

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

// Goes through the same shared singleton the GraphQL error link and the idle-session
// modal use (see errorLinks.ts) — the backend rotates the refresh token on every use,
// so a REST call's 401 racing an independent GraphQL-triggered (or proactive timer)
// refresh over the same single-use token could otherwise force-logout an active user.
async function refreshTokenCall(): Promise<boolean> {
  const ok = await sharedRefreshToken().catch(() => false);
  if (!ok) throw new Error("");
  return true;
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
