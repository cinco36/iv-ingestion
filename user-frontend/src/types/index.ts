import React from 'react';

// User Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'inspector';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    processing: boolean;
    findings: boolean;
  };
  language: string;
  timezone: string;
}

// Authentication Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

// Property Types
export interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: 'residential' | 'commercial' | 'industrial';
  squareFootage?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

// Inspection Types
export interface Inspection {
  id: number;
  propertyId: number;
  property: Property;
  inspectorId: number;
  inspector: User;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inspectionDate: string;
  completedAt?: string;
  findingsCount: number;
  criticalFindings: number;
  majorFindings: number;
  minorFindings: number;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}

// Finding Types
export interface Finding {
  id: number;
  inspectionId: number;
  category: 'electrical' | 'plumbing' | 'structural' | 'hvac' | 'roofing' | 'interior' | 'exterior' | 'safety' | 'other';
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  location: string;
  estimatedCost: number;
  priority: number;
  status: 'open' | 'addressed' | 'ignored';
  photos: FindingPhoto[];
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FindingPhoto {
  id: number;
  findingId: number;
  url: string;
  caption?: string;
  uploadedAt: string;
}

// File Upload Types
export interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
  uploadedAt?: string;
  processedAt?: string;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  status: string;
  message?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  severity?: string[];
  category?: string[];
  inspectorId?: number;
  propertyType?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Socket.IO Types
export interface SocketEvents {
  'upload:progress': UploadProgress;
  'inspection:update': Inspection;
  'processing:complete': { inspectionId: number };
  'notification:new': Notification;
}

// Chart and Analytics Types
export interface FindingDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface SeverityBreakdown {
  severity: string;
  count: number;
  totalCost: number;
}

export interface TimelineData {
  date: string;
  inspections: number;
  findings: number;
  cost: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'date' | 'number';
  required?: boolean;
  validation?: any;
  options?: { value: string; label: string }[];
}

// Component Props Types
export interface LayoutProps {
  children: React.ReactNode;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
} 