import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useCustomerStore } from '@/lib/store/useCustomerStore';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

// --- Refresh Logic State ---
let isRefreshingAdmin = false;
let adminRefreshSubscribers: ((token: string) => void)[] = [];

let isRefreshingShop = false;
let shopRefreshSubscribers: ((token: string) => void)[] = [];

const subscribeAdminRefresh = (cb: (token: string) => void) => {
  adminRefreshSubscribers.push(cb);
};

const onAdminRefreshed = (token: string) => {
  adminRefreshSubscribers.map((cb) => cb(token));
  adminRefreshSubscribers = [];
};

const subscribeShopRefresh = (cb: (token: string) => void) => {
  shopRefreshSubscribers.push(cb);
};

const onShopRefreshed = (token: string) => {
  shopRefreshSubscribers.map((cb) => cb(token));
  shopRefreshSubscribers = [];
};

/**
 * Admin API Instance
 * Used for all administrative and staff actions.
 */
export const adminApi = axios.create({
  baseURL,
  withCredentials: true,
});

adminApi.interceptors.request.use((config) => {
  // Use getState() to get the latest token from the Zustand store
  const token = useAuthStore?.getState?.()?.token;
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Prevent refresh logic on login routes or if request config is missing
    const isAuthRoute = originalRequest?.url?.includes('/auth/login-password') || 
                        originalRequest?.url?.includes('/auth/login/verify') ||
                        originalRequest?.url?.includes('/auth/login/send-otp');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshingAdmin) {
        return new Promise((resolve) => {
          subscribeAdminRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(adminApi(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshingAdmin = true;

      try {
        // deviceInfo is standard across all web calls
        const response = await axios.post(
          `${baseURL}/auth/refresh-token`,
          { deviceInfo: 'Web Browser', tokenType: 'admin' },
          { withCredentials: true }
        );

        const { accessToken, user } = response.data.data;
        useAuthStore.getState().setAuth(user, accessToken);
        
        onAdminRefreshed(accessToken);
        isRefreshingAdmin = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return adminApi(originalRequest);
      } catch (refreshError) {
        isRefreshingAdmin = false;
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Elevated Access Requirement
    if (error.response?.status === 403) {
      const data = error.response.data as any;
      const message = data?.message || '';
      if (message.includes('Elevated actions require a password login')) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Shop API Instance
 * Used for all customer-facing storefront actions.
 */
export const shopApi = axios.create({
  baseURL,
  withCredentials: true,
});

/**
 * Public API Instance
 * Used for all public storefront actions (no auth).
 */
export const api = axios.create({
  baseURL,
});

shopApi.interceptors.request.use((config) => {
  const token = useCustomerStore?.getState?.()?.token;
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

shopApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Prevent refresh logic on login routes or if request config is missing
    const isAuthRoute = originalRequest?.url?.includes('/auth/login-password') || 
                        originalRequest?.url?.includes('/auth/login/verify') ||
                        originalRequest?.url?.includes('/auth/login/send-otp');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshingShop) {
        return new Promise((resolve) => {
          subscribeShopRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(shopApi(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshingShop = true;

      try {
        const response = await axios.post(
          `${baseURL}/auth/refresh-token`,
          { deviceInfo: 'Web Browser', tokenType: 'customer' },
          { withCredentials: true }
        );

        const { accessToken, user } = response.data.data;
        useCustomerStore.getState().setCustomerAuth(user, accessToken);
        
        onShopRefreshed(accessToken);
        isRefreshingShop = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return shopApi(originalRequest);
      } catch (refreshError) {
        isRefreshingShop = false;
        useCustomerStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
