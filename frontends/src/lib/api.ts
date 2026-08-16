import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token =
        sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.data?.accessToken;
        if (newToken && typeof window !== 'undefined') {
          sessionStorage.setItem('accessToken', newToken);
          localStorage.removeItem('accessToken');
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('accessToken');
          localStorage.removeItem('accessToken');
          const returnTo = encodeURIComponent(
            window.location.pathname + window.location.search
          );
          window.location.href = `/login?expired=true&redirect=${returnTo}`;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
