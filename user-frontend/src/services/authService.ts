import axios from 'axios';
import { User, LoginCredentials, RegisterData, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { token } = response.data.data;
          localStorage.setItem('authToken', token);
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please try again.');
    }
  },

  // Register user
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/me');
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to get user data');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get user data');
    }
  },

  // Refresh token
  async refreshToken(): Promise<{ user: User; token: string }> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/refresh', {
        refreshToken,
      });
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Token refresh failed');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Token refresh failed');
    }
  },

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>('/auth/forgot-password', { email });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to send reset email');
    }
  },

  // Reset password
  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>('/auth/reset-password', {
        token,
        password,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to reset password');
    }
  },

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>('/auth/profile', userData);
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update profile');
    }
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to change password');
    }
  },

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>('/auth/verify-email', { token });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to verify email');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to verify email');
    }
  },

  // Resend verification email
  async resendVerificationEmail(): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>('/auth/resend-verification');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to resend verification email');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to resend verification email');
    }
  },
}; 