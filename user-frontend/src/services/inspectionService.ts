import axios from 'axios';
import { 
  Inspection, 
  Finding, 
  SearchFilters, 
  SortOptions, 
  PaginatedResponse, 
  ApiResponse 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with auth interceptor
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

export const inspectionService = {
  // Get all inspections with pagination and filters
  async getInspections(
    page = 1,
    limit = 10,
    filters?: SearchFilters,
    sort?: SortOptions
  ): Promise<PaginatedResponse<Inspection>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.query && { query: filters.query }),
        ...(filters?.status && { status: filters.status.join(',') }),
        ...(filters?.severity && { severity: filters.severity.join(',') }),
        ...(filters?.category && { category: filters.category.join(',') }),
        ...(filters?.dateRange?.start && { startDate: filters.dateRange.start }),
        ...(filters?.dateRange?.end && { endDate: filters.dateRange.end }),
        ...(sort && { sortBy: sort.field, sortOrder: sort.direction }),
      });

      const response = await api.get<ApiResponse<PaginatedResponse<Inspection>>>(
        `/inspections?${params.toString()}`
      );

      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to fetch inspections');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch inspections');
    }
  },

  // Get inspection by ID
  async getInspection(id: number): Promise<Inspection> {
    try {
      const response = await api.get<ApiResponse<Inspection>>(`/inspections/${id}`);
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to fetch inspection');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch inspection');
    }
  },

  // Get findings for an inspection
  async getInspectionFindings(inspectionId: number): Promise<Finding[]> {
    try {
      const response = await api.get<ApiResponse<Finding[]>>(
        `/inspections/${inspectionId}/findings`
      );
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to fetch findings');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch findings');
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<any> {
    try {
      const response = await api.get<ApiResponse<any>>('/inspections/stats/dashboard');
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard stats');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch dashboard stats');
    }
  },

  // Get recent inspections
  async getRecentInspections(limit = 5): Promise<Inspection[]> {
    try {
      const response = await api.get<ApiResponse<Inspection[]>>(
        `/inspections/recent?limit=${limit}`
      );
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to fetch recent inspections');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch recent inspections');
    }
  },

  // Create new inspection
  async createInspection(inspectionData: Partial<Inspection>): Promise<Inspection> {
    try {
      const response = await api.post<ApiResponse<Inspection>>('/inspections', inspectionData);
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to create inspection');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create inspection');
    }
  },

  // Update inspection
  async updateInspection(id: number, inspectionData: Partial<Inspection>): Promise<Inspection> {
    try {
      const response = await api.put<ApiResponse<Inspection>>(`/inspections/${id}`, inspectionData);
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to update inspection');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update inspection');
    }
  },

  // Delete inspection
  async deleteInspection(id: number): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/inspections/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete inspection');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to delete inspection');
    }
  },

  // Export inspection report
  async exportInspectionReport(id: number, format: 'pdf' | 'csv' = 'pdf'): Promise<Blob> {
    try {
      const response = await api.get(`/inspections/${id}/export?format=${format}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to export inspection report');
    }
  },

  // Get inspection analytics
  async getInspectionAnalytics(filters?: SearchFilters): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters?.dateRange?.start) params.append('startDate', filters.dateRange.start);
      if (filters?.dateRange?.end) params.append('endDate', filters.dateRange.end);

      const response = await api.get<ApiResponse<any>>(
        `/inspections/analytics?${params.toString()}`
      );
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch analytics');
    }
  },

  // Search inspections
  async searchInspections(query: string): Promise<Inspection[]> {
    try {
      const response = await api.get<ApiResponse<Inspection[]>>(
        `/inspections/search?q=${encodeURIComponent(query)}`
      );
      
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.message || 'Failed to search inspections');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to search inspections');
    }
  },
}; 