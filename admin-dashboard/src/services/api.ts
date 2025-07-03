import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('authToken');
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getMetrics: async () => {
    const response = await api.get('/admin/metrics');
    return response.data;
  },
  getSystemHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data;
  },
};

// Files API
export const filesAPI = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getFiles: async () => {
    const response = await api.get('/files');
    return response.data;
  },
  getFileById: async (id: string) => {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },
  deleteFile: async (id: string) => {
    await api.delete(`/files/${id}`);
  },
};

// Queue API
export const queueAPI = {
  getQueueStatus: async () => {
    const response = await api.get('/admin/queues');
    return response.data;
  },
  getJobDetails: async (jobId: string) => {
    const response = await api.get(`/admin/queues/jobs/${jobId}`);
    return response.data;
  },
  retryJob: async (jobId: string) => {
    const response = await api.post(`/admin/queues/jobs/${jobId}/retry`);
    return response.data;
  },
  deleteJob: async (jobId: string) => {
    await api.delete(`/admin/queues/jobs/${jobId}`);
  },
};

// Users API
export const usersAPI = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  createUser: async (userData: any) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },
  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id: string) => {
    await api.delete(`/admin/users/${id}`);
  },
};

// System API
export const systemAPI = {
  getSystemInfo: async () => {
    const response = await api.get('/admin/system');
    return response.data;
  },
  getLogs: async () => {
    const response = await api.get('/admin/logs');
    return response.data;
  },
  clearLogs: async () => {
    await api.delete('/admin/logs');
  },
};

// Default export for backward compatibility
const apiService = {
  ...authAPI,
  ...dashboardAPI,
  ...filesAPI,
  ...queueAPI,
  ...usersAPI,
  ...systemAPI,
};

export default apiService; 