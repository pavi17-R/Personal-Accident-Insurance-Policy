import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// ---- Customers ----
export const getCustomers = (search = '') => api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// ---- Policies ----
export const getPolicies = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/policies${query ? `?${query}` : ''}`);
};
export const getPolicyById = (id) => api.get(`/policies/${id}`);
export const createPolicy = (data) => api.post('/policies', data);
export const updatePolicy = (id, data) => api.put(`/policies/${id}`, data);
export const renewPolicy = (id, data) => api.post(`/policies/${id}/renew`, data);
export const cancelPolicy = (id, data) => api.post(`/policies/${id}/cancel`, data);
export const bindPolicy = (id) => api.post(`/policies/${id}/bind`);
export const declinePolicy = (id, data) => api.post(`/policies/${id}/decline`, data);
export const calculatePremium = (data) => api.post('/policies/calculate-premium', data);
export const assessRisk = (data) => api.post('/policies/assess-risk', data);

// ---- Claims ----
export const getClaims = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/claims${query ? `?${query}` : ''}`);
};
export const getClaimById = (id) => api.get(`/claims/${id}`);
export const createClaim = (data) => api.post('/claims', data);
export const assessFraud = (data) => api.post('/claims/assess-fraud', data);
export const decideClaim = (id, data) => api.post(`/claims/${id}/decide`, data);
export const markClaimPaid = (id) => api.post(`/claims/${id}/mark-paid`);

// ---- Dashboard ----
export const getDashboard = () => api.get('/dashboard');

// ---- Search & Activities ----
export const globalSearch = (q) => api.get(`/search?q=${encodeURIComponent(q)}`);
export const getActivities = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/activities${query ? `?${query}` : ''}`);
};

export default api;
