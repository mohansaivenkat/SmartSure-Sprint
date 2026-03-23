import axios from 'axios';

const API = axios.create({
  baseURL: '',
  timeout: 15000,
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

// Response interceptor - handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICE ====================
export const authAPI = {
  login: (data) => API.post('/auth-service/api/auth/login', data),  register: (data) => API.post('/auth-service/api/auth/register', data),
  sendOtp: (email) => API.post(`/auth-service/api/auth/send-otp?email=${email}`),
  verifyOtp: (email, otp) => API.post(`/auth-service/api/auth/verify-otp?email=${email}&otp=${otp}`),
  getUserById: (id) => API.get(`/auth-service/api/auth/users/${id}`),
};

// ==================== POLICY SERVICE ====================
export const policyAPI = {
  getAllPolicies: () => API.get('/policy-service/api/policies'),
  getPolicyById: (id) => API.get(`/policy-service/api/policies/${id}`),
  getPolicyTypes: () => API.get('/policy-service/api/policy-types'),
  purchasePolicy: (policyId) => API.post(`/policy-service/api/policies/purchase?policyId=${policyId}`),
  getUserPolicies: (userId) => API.get(`/policy-service/api/policies/user/${userId}`),
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
};

// ==================== PAYMENT SERVICE ====================
export const paymentAPI = {
  createOrder: (data) => API.post('/payment-service/payment/create', data),
  verifyPayment: (data) => API.post('/payment-service/payment/verify', data),
};

export default API;
