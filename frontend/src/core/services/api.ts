import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

const AUTH_FREE_API = axios.create({
  baseURL: BASE_URL,
});

const INTERNAL_AUTH = axios.create({
  baseURL: BASE_URL,
});

// Step A: Attach token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Step B: Internal recovery
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: any) => void }> = [];

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

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      }).catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    return new Promise(async (resolve, reject) => {
      try {
        const response = await INTERNAL_AUTH.post(
          `/auth-service/api/auth/refresh-token?refreshToken=${refreshToken}`
        );

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
        if (!newAccessToken) throw new Error('No token returned');

        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        resolve(API(originalRequest));
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        forceLogout();
        reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    });
  }
);

const forceLogout = () => {
  localStorage.clear();
  window.location.href = '/login';
};

export const authAPI = {
  login: (data: any) => AUTH_FREE_API.post('/auth-service/api/auth/login', data),
  register: (data: any) => AUTH_FREE_API.post('/auth-service/api/auth/register', data),
  refreshToken: (token: string) => AUTH_FREE_API.post(`/auth-service/api/auth/refresh-token?refreshToken=${token}`),
  sendOtp: (email: string) => AUTH_FREE_API.post(`/auth-service/api/auth/send-otp?email=${email}`),
  verifyOtp: (email: string, otp: string) => AUTH_FREE_API.post(`/auth-service/api/auth/verify-otp?email=${email}&otp=${otp}`),
  forgotPasswordSendOtp: (email: string) => AUTH_FREE_API.post(`/auth-service/api/auth/forgot-password/send-otp?email=${email}`),
  forgotPasswordVerifyOtp: (email: string, otp: string) => AUTH_FREE_API.post(`/auth-service/api/auth/forgot-password/verify-otp?email=${email}&otp=${otp}`),
  resetPassword: (data: any) => AUTH_FREE_API.post('/auth-service/api/auth/reset-password', data),
  updateProfile: (data: any) => API.put('/auth-service/api/auth/profile', data),
  getUserById: (id: string | number, config?: any) => API.get(`/auth-service/api/auth/users/${id}`, config),
};

export const policyAPI = {
  getAllPolicies: () => API.get('/policy-service/api/policies'),
  getPolicyById: (id: string | number) => API.get(`/policy-service/api/policies/${id}`),
  getPolicyTypes: () => API.get('/policy-service/api/policy-types'),
  purchasePolicy: (policyId: string | number) => API.post(`/policy-service/api/policies/purchase?policyId=${policyId}`),
  getUserPolicies: (userId: string | number) => API.get(`/policy-service/api/policies/user/${userId}`),
  requestCancellation: (id: string | number) => API.put(`/policy-service/api/policies/user-policies/${id}/request-cancellation`, {}),
  payPremium: (id: string | number, amount: number) => API.put(`/policy-service/api/policies/user-policies/${id}/pay-premium?amount=${amount}`, {}),
};

export const claimsAPI = {
  initiateClaim: (data: any) => API.post('/claims-service/api/claims/initiate', data),
  uploadDocument: (claimId: string | number, file: File) => {
    const formData = new FormData();
    formData.append('claimId', String(claimId));
    formData.append('file', file);
    return API.post('/claims-service/api/claims/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getClaimStatus: (claimId: string | number) => API.get(`/claims-service/api/claims/status/${claimId}`),
  getClaimById: (claimId: string | number) => API.get(`/claims-service/api/claims/${claimId}`),
  getClaimsByUser: (userId: string | number) => API.get(`/claims-service/api/claims/user/${userId}`),
  downloadDocument: (claimId: string | number) => API.get(`/claims-service/api/claims/${claimId}/document`, { responseType: 'blob' }),
};

export const adminAPI = {
  reviewClaim: (claimId: string | number, data: any) => API.put(`/admin-service/api/admin/claims/${claimId}/review`, data),
  getClaimStatus: (claimId: string | number) => API.get(`/admin-service/api/admin/claims/status/${claimId}`),
  getClaimsByUser: (userId: string | number) => API.get(`/admin-service/api/admin/claims/user/${userId}`),
  downloadClaimDocument: (claimId: string | number) => API.get(`/admin-service/api/admin/claims/${claimId}/document`, { responseType: 'blob' }),
  createPolicy: (data: any) => API.post('/admin-service/api/admin/policies', data),
  updatePolicy: (id: string | number, data: any) => API.put(`/admin-service/api/admin/policies/${id}`, data),
  deletePolicy: (id: string | number) => API.delete(`/admin-service/api/admin/policies/${id}`),
  getReports: () => API.get('/admin-service/api/admin/reports'),
  getUsers: () => API.get('/admin-service/api/admin/users'),
  getAllUserPolicies: () => API.get('/policy-service/api/admin/user-policies'),
  approveCancellation: (id: string | number) => API.put(`/policy-service/api/admin/policies/user-policies/${id}/approve-cancellation`),
  getUserPolicies: (userId: string | number) => API.get(`/policy-service/api/policies/user/${userId}`),
  getAllClaims: () => API.get('/admin-service/api/admin/claims'),
};

export const paymentAPI = {
  createOrder: (data: any) => API.post('/payment-service/payment/create', data),
  verifyPayment: (data: any) => API.post('/payment-service/payment/verify', data),
};

export default API;
