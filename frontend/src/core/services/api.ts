import API from '../api/axiosInstance';

/**
 * ─────────────────────────────────────────────────────────────
 * API Service Layer
 * ─────────────────────────────────────────────────────────────
 * All services now use the shared axiosInstance (from ../api/axiosInstance)
 * which handles global Bearer tokens and automatic token refreshing.
 */

export const authAPI = {
  login: (data: any) => API.post('/auth-service/api/auth/login', data),
  register: (data: any) => API.post('/auth-service/api/auth/register', data),
  refreshToken: (token: string) => API.post(`/auth-service/api/auth/refresh-token?refreshToken=${token}`),
  sendOtp: (email: string) => API.post(`/auth-service/api/auth/send-otp?email=${email}`),
  verifyOtp: (email: string, otp: string) => API.post(`/auth-service/api/auth/verify-otp?email=${email}&otp=${otp}`),
  forgotPasswordSendOtp: (email: string) => API.post(`/auth-service/api/auth/forgot-password/send-otp?email=${email}`),
  forgotPasswordVerifyOtp: (email: string, otp: string) => API.post(`/auth-service/api/auth/forgot-password/verify-otp?email=${email}&otp=${otp}`),
  resetPassword: (data: any) => API.post('/auth-service/api/auth/reset-password', data),
  updateProfile: (data: any) => API.put('/auth-service/api/auth/profile', data),
  getProfile: () => API.get('/auth-service/api/auth/profile'),
  getUserById: (id: string | number, config?: any) => API.get(`/auth-service/api/auth/users/${id}`, config),
  getUsersPaginated: (page: number, size: number, query: string) =>
    API.get(`/auth-service/api/auth/users/paginated?page=${page}&size=${size}&query=${query}`),
};

export const policyAPI = {
  getAllPolicies: () => API.get('/policy-service/api/policies'),
  getPolicyById: (id: string | number) => API.get(`/policy-service/api/policies/${id}`),
  getPolicyTypes: () => API.get('/policy-service/api/policy-types'),
  purchasePolicy: (policyId: string | number) => API.post(`/policy-service/api/policies/purchase?policyId=${policyId}`),
  getUserPolicies: (userId: string | number) => API.get(`/policy-service/api/policies/user/${userId}`),
  getUserPoliciesPaginated: (userId: string | number, status: string, page: number, size: number) => 
    API.get(`/policy-service/api/policies/user/${userId}/paginated?status=${status}&page=${page}&size=${size}`),
  requestCancellation: (id: string | number, reason: string) => API.put(`/policy-service/api/policies/user-policies/${id}/request-cancellation`, { reason }),
  payPremium: (id: string | number, amount: number) => API.put(`/policy-service/api/policies/user-policies/${id}/pay-premium?amount=${amount}`, {}),
  searchPolicies: (category: string, query: string, page: number, size: number) =>
    API.get(`/policy-service/api/policies/search?category=${category}&query=${query}&page=${page}&size=${size}`),
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
  getClaimsByUserPaginated: (userId: string | number, page: number, size: number, query: string) =>
    API.get(`/claims-service/api/claims/user/${userId}/paginated?page=${page}&size=${size}&query=${query}`),
  downloadDocument: (claimId: string | number) => API.get(`/claims-service/api/claims/${claimId}/document`, { responseType: 'blob' }),
};

export const adminAPI = {
  reviewClaim: (claimId: string | number, data: any) => API.put(`/admin-service/api/admin/claims/${claimId}/review`, data),
  getClaimStatus: (claimId: string | number) => API.get(`/admin-service/api/admin/claims/status/${claimId}`),
  getClaimsByUser: (userId: string | number) => API.get(`/admin-service/api/admin/claims/user/${userId}`),
  downloadClaimDocument: (claimId: string | number) => API.get(`/claims-service/api/claims/${claimId}/document`, { responseType: 'blob' }),
  createPolicy: (data: any) => API.post('/admin-service/api/admin/policies', data),
  updatePolicy: (id: string | number, data: any) => API.put(`/admin-service/api/admin/policies/${id}`, data),
  deletePolicy: (id: string | number) => API.delete(`/admin-service/api/admin/policies/${id}`),
  getReports: () => API.get('/admin-service/api/admin/reports'),
  getUsers: () => API.get('/admin-service/api/admin/users'),
  getFilteredUsers: (page: number, size: number, search: string, policyStatus?: string, claimStatus?: string) => {
    let url = `/admin-service/api/admin/users/stats-paginated?page=${page}&size=${size}&search=${encodeURIComponent(search)}`;
    if (policyStatus && policyStatus !== 'ALL') url += `&policyStatus=${policyStatus}`;
    if (claimStatus && claimStatus !== 'ALL') url += `&claimStatus=${claimStatus}`;
    return API.get(url);
  },
  getPaginatedUserPolicies: (userId: string | number, page: number, size: number) =>
    API.get(`/policy-service/api/policies/user/${userId}?page=${page}&size=${size}`),
  getAllUserPolicies: () => API.get('/policy-service/api/admin/user-policies'),
  getAllUserPoliciesPaginated: (page: number, size: number) => 
    API.get(`/policy-service/api/admin/user-policies/all-paginated?page=${page}&size=${size}`),
  approveCancellation: (id: string | number) => API.put(`/policy-service/api/admin/policies/user-policies/${id}/approve-cancellation`),
  getUserPolicies: (userId: string | number) => API.get(`/policy-service/api/policies/user/${userId}`),
  getAllClaims: () => API.get('/admin-service/api/admin/claims'),
  getAllClaimsPaginated: (page: number, size: number, query: string) =>
    API.get(`/claims-service/api/claims/paginated?page=${page}&size=${size}&query=${query}`),
};

export const paymentAPI = {
  createOrder: (data: any) => API.post('/payment-service/payment/create', data),
  verifyPayment: (data: any) => API.post('/payment-service/payment/verify', data),
};

export default API;
