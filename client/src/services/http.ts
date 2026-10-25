import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Instance Axios tập trung
export const http = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Gửi cookie refreshToken HttpOnly tự động
});

let accessTokenGetter: (() => string | null) | null = null;
let tokenRefresher: (() => Promise<string | null>) | null = null;
let logoutHandler: (() => void) | null = null;

export const setAuthTokenHandlers = (
  getToken: () => string | null,
  refreshToken: () => Promise<string | null>,
  logout: () => void,
) => {
  accessTokenGetter = getToken;
  tokenRefresher = refreshToken;
  logoutHandler = logout;
};

// Request Interceptor: Tự động đính kèm Bearer token
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessTokenGetter) {
      const token = accessTokenGetter();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Lock promise để tránh gọi refresh token nhiều lần đồng thời khi nhiều request 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Tự động làm mới access token khi nhận mã 401
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Nếu mã lỗi là 401 và không phải request đăng nhập/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return http(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (tokenRefresher) {
          const newToken = await tokenRefresher();
          if (newToken) {
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return http(originalRequest);
          }
        }
        throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (logoutHandler) {
          logoutHandler();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
