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

// Request interceptor - attach JWT token
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

// ==================== THE INTERNAL LOGIC (Interceptors) ====================

// Step A: Attach the current token to every outgoing request
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

// Step B: The "Internal Recovery" - Handle 401s silently with a single refresh flow
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
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

    // Avoid repetition for same request
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.warn('🚪 No refresh token available, forcing logout.');
      forceLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    return new Promise(async (resolve, reject) => {
      try {
        console.log('📡 Refresh token request started');
        const response = await INTERNAL_AUTH.post(
          `/auth-service/api/auth/refresh-token?refreshToken=${refreshToken}`
        );

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

        if (!newAccessToken) {
          throw new Error('No access token returned from refresh endpoint');
        }

        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        API.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        console.log('✅ Refresh successful, retrying original request');

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        resolve(API(originalRequest));
      } catch (refreshError) {
        console.error('❌ Refresh failed:', refreshError.response?.data || refreshError.message);
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

// ==================== AUTH SERVICE ====================
// export const authAPI = {
//   login: (data) => API.post('/auth-service/api/auth/login', data),

//   refreshToken: (token) => API.post(`/auth-service/api/auth/refresh-token?refreshToken=${token}`),
//   register: (data) => API.post('/auth-service/api/auth/register', data),
//   sendOtp: (email) => API.post(`/auth-service/api/auth/send-otp?email=${email}`),
//   verifyOtp: (email, otp) => API.post(`/auth-service/api/auth/verify-otp?email=${email}&otp=${otp}`),
//   forgotPasswordSendOtp: (email) => API.post(`/auth-service/api/auth/forgot-password/send-otp?email=${email}`),
//   forgotPasswordVerifyOtp: (email, otp) => API.post(`/auth-service/api/auth/forgot-password/verify-otp?email=${email}&otp=${otp}`),
//   resetPassword: (data) => API.post('/auth-service/api/auth/reset-password', data),
//   updateProfile: (data) => API.put('/auth-service/api/auth/profile', data),
//   getUserById: (id, config) => API.get(`/auth-service/api/auth/users/${id}`, config),
// };

export const authAPI = {
  // PUBLIC ENDPOINTS (Use the instance WITHOUT interceptors)
  login: (data) => AUTH_FREE_API.post('/auth-service/api/auth/login', data),
  register: (data) => AUTH_FREE_API.post('/auth-service/api/auth/register', data),
  refreshToken: (token) => AUTH_FREE_API.post(`/auth-service/api/auth/refresh-token?refreshToken=${token}`),
  sendOtp: (email) => AUTH_FREE_API.post(`/auth-service/api/auth/send-otp?email=${email}`),
  verifyOtp: (email, otp) => AUTH_FREE_API.post(`/auth-service/api/auth/verify-otp?email=${email}&otp=${otp}`),
  forgotPasswordSendOtp: (email) => AUTH_FREE_API.post(`/auth-service/api/auth/forgot-password/send-otp?email=${email}`),
  forgotPasswordVerifyOtp: (email, otp) => AUTH_FREE_API.post(`/auth-service/api/auth/forgot-password/verify-otp?email=${email}&otp=${otp}`),
  resetPassword: (data) => AUTH_FREE_API.post('/auth-service/api/auth/reset-password', data),

  // SECURE ENDPOINTS (Use the 'API' instance WITH interceptors)
  // This allows these calls to "internally" trigger a refresh if the token is old
  updateProfile: (data) => API.put('/auth-service/api/auth/profile', data),
  getUserById: (id, config) => API.get(`/auth-service/api/auth/users/${id}`, config),
};

// ==================== OTHER SERVICES ====================
// These stay exactly as they were, using 'API'

// ==================== POLICY SERVICE ====================
export const policyAPI = {
  getAllPolicies: () => API.get('/policy-service/api/policies'),
  getPolicyById: (id) => API.get(`/policy-service/api/policies/${id}`),
  getPolicyTypes: () => API.get('/policy-service/api/policy-types'),
  purchasePolicy: (policyId) => API.post(`/policy-service/api/policies/purchase?policyId=${policyId}`),
  getUserPolicies: (userId) => API.get(`/policy-service/api/policies/user/${userId}`),
  requestCancellation: (id) => API.put(`/policy-service/api/policies/user-policies/${id}/request-cancellation`, {}),
  payPremium: (id, amount) => API.put(`/policy-service/api/policies/user-policies/${id}/pay-premium?amount=${amount}`, {}),
};

// ==================== CLAIMS SERVICE ====================
export const claimsAPI = {
  initiateClaim: (data) => API.post('/claims-service/api/claims/initiate', data),
  uploadDocument: (claimId, file) => {
    const formData = new FormData();
    formData.append('claimId', claimId);
    formData.append('file', file);
    return API.post('/claims-service/api/claims/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getClaimStatus: (claimId) => API.get(`/claims-service/api/claims/status/${claimId}`),
  getClaimById: (claimId) => API.get(`/claims-service/api/claims/${claimId}`),
  getClaimsByUser: (userId) => API.get(`/claims-service/api/claims/user/${userId}`),
  downloadDocument: (claimId) => API.get(`/claims-service/api/claims/${claimId}/document`, { responseType: 'blob' }),
};

// ==================== ADMIN SERVICE ====================
export const adminAPI = {
  reviewClaim: (claimId, data) => API.put(`/admin-service/api/admin/claims/${claimId}/review`, data),
  getClaimStatus: (claimId) => API.get(`/admin-service/api/admin/claims/status/${claimId}`),
  getClaimsByUser: (userId) => API.get(`/admin-service/api/admin/claims/user/${userId}`),
  downloadClaimDocument: (claimId) => API.get(`/admin-service/api/admin/claims/${claimId}/document`, { responseType: 'blob' }),
  createPolicy: (data) => API.post('/admin-service/api/admin/policies', data),
  updatePolicy: (id, data) => API.put(`/admin-service/api/admin/policies/${id}`, data),
  deletePolicy: (id) => API.delete(`/admin-service/api/admin/policies/${id}`),
  getReports: () => API.get('/admin-service/api/admin/reports'),
  getUsers: () => API.get('/admin-service/api/admin/users'),
  getAllUserPolicies: () => API.get('/policy-service/api/admin/user-policies'),
  approveCancellation: (id) => API.put(`/policy-service/api/admin/policies/user-policies/${id}/approve-cancellation`),
  getUserPolicies: (userId) => API.get(`/policy-service/api/policies/user/${userId}`),
  getAllClaims: () => API.get('/admin-service/api/admin/claims'),
};

// ==================== PAYMENT SERVICE ====================
export const paymentAPI = {
  createOrder: (data) => API.post('/payment-service/payment/create', data),
  verifyPayment: (data) => API.post('/payment-service/payment/verify', data),
};

export default API;
