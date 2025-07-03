// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// System Health and Monitoring Types
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error' | 'offline';
  database: HealthStatus;
  redis: HealthStatus;
  fileStorage: HealthStatus;
  queue: HealthStatus;
  lastChecked: string;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'error' | 'offline';
  responseTime: number;
  message?: string;
  lastChecked: string;
}

export interface PerformanceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: string;
}

// File Processing Types
export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedBy: string;
  uploadedAt: string;
  processedAt?: string;
  processingTime?: number;
  error?: string;
  extractedData?: ExtractedData;
}

export interface ExtractedData {
  property: PropertyData;
  inspector: InspectorData;
  findings: FindingData[];
  confidence: number;
  processingSteps: ProcessingStep[];
}

export interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  yearBuilt?: number;
}

export interface InspectorData {
  name: string;
  license: string;
  company: string;
  contact: string;
}

export interface FindingData {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  recommendation: string;
}

export interface ProcessingStep {
  step: string;
  status: 'pending' | 'completed' | 'failed';
  duration: number;
  details?: string;
}

// Queue and Job Types
export interface QueueJob {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  data: any;
  opts: any;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  attemptsMade: number;
  maxAttempts: number;
}

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  workers: WorkerStatus[];
}

export interface WorkerStatus {
  id: string;
  status: 'idle' | 'working' | 'offline';
  currentJob?: string;
  processedJobs: number;
  failedJobs: number;
  uptime: number;
  lastHeartbeat: string;
}

// API Testing Types
export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: ApiParameter[];
  responses: ApiResponse[];
  requiresAuth: boolean;
}

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  schema?: any;
  example?: any;
}

export interface ApiTestRequest {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

export interface ApiTestResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  duration: number;
  timestamp: string;
}

// Dashboard and Analytics Types
export interface DashboardMetrics {
  filesProcessed: {
    today: number;
    yesterday: number;
    total: number;
  };
  queueDepth: {
    current: number;
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  errorRate: {
    current: number;
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  activeUsers: {
    current: number;
    total: number;
  };
  processingRate: {
    perHour: number;
    perDay: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

// Theme and UI Types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

// Error and Log Types
export interface ErrorLog {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  stack?: string;
  timestamp: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingLog {
  id: string;
  fileId: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  step: string;
  details?: any;
}

// Configuration Types
export interface SystemConfig {
  features: {
    fileUpload: boolean;
    realTimeUpdates: boolean;
    notifications: boolean;
    analytics: boolean;
  };
  limits: {
    maxFileSize: number;
    maxConcurrentUploads: number;
    maxQueueDepth: number;
  };
  maintenance: {
    mode: boolean;
    message?: string;
  };
}

// Real-time Event Types
export interface RealTimeEvent {
  type: 'file_processed' | 'job_completed' | 'error_occurred' | 'system_alert';
  data: any;
  timestamp: string;
}

// Form and Input Types
export interface FileUploadConfig {
  maxFiles: number;
  maxSize: number;
  acceptedTypes: string[];
  autoProcess: boolean;
}

export interface BulkUploadJob {
  id: string;
  files: FileInfo[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
} 