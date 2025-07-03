/**
 * Core types for the IV Ingestion SDK
 */

export interface IVIngestionConfig {
  /** API base URL */
  baseURL?: string;
  /** API key for authentication */
  apiKey?: string;
  /** JWT token for authentication */
  token?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'inspector';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export interface FileUploadRequest {
  file: File | Buffer;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  fileId: string;
  filename: string;
  size: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processingJobId: string;
  estimatedProcessingTime: number;
}

export interface FileStatus {
  fileId: string;
  filename: string;
  size: number;
  mimeType: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  progress: number;
  uploadedAt: string;
  processedAt?: string;
  processingTime?: number;
  findings: Finding[];
}

export interface Finding {
  id: string;
  category: 'electrical' | 'plumbing' | 'structural' | 'hvac' | 'roofing' | 'interior' | 'exterior' | 'safety' | 'other';
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  location: string;
  estimatedCost?: number;
  priority: number;
}

export interface Inspection {
  id: string;
  propertyId: string;
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

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: 'residential' | 'commercial' | 'industrial';
  squareFootage?: number;
  yearBuilt?: number;
}

export interface InspectionDetail extends Inspection {
  findings: Finding[];
  property: Property;
}

export interface InspectionsListRequest {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  dateFrom?: string;
  dateTo?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InspectionsListResponse {
  inspections: Inspection[];
  pagination: Pagination;
}

export interface WebhookEvent {
  processing_started: 'processing.started';
  processing_progress: 'processing.progress';
  processing_completed: 'processing.completed';
  processing_failed: 'processing.failed';
  inspection_created: 'inspection.created';
  inspection_updated: 'inspection.updated';
  finding_added: 'finding.added';
  user_registered: 'user.registered';
}

export type WebhookEventType = WebhookEvent[keyof WebhookEvent];

export interface WebhookCreateRequest {
  url: string;
  events: WebhookEventType[];
  description?: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEventType[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
}

export interface WebhooksListResponse {
  webhooks: Webhook[];
}

export interface AdminMetrics {
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
    trend: string;
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

export interface QueueWorker {
  id: string;
  status: 'idle' | 'working' | 'error';
  currentJob?: string;
  processedJobs: number;
  failedJobs: number;
  uptime: number;
  lastHeartbeat: string;
}

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  workers: QueueWorker[];
}

export interface AdminQueuesResponse {
  queues: QueueStatus[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  message: string;
  services: {
    database: string;
    redis: string;
    fileStorage: string;
    queue: string;
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  estimatedTime: number;
}

export interface ProcessingProgress {
  fileId: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  estimatedTimeRemaining: number;
}

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: any;
  signature?: string;
}

export interface ErrorDetails {
  field?: string;
  message: string;
  code?: string;
}

export class IVIngestionError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: ErrorDetails[] | undefined;

  constructor(message: string, code: string, status: number, details?: ErrorDetails[]) {
    super(message);
    this.name = 'IVIngestionError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface RequestInterceptor {
  (config: any): any;
}

export interface ResponseInterceptor {
  (response: any): any;
}

export interface ErrorInterceptor {
  (error: IVIngestionError): any;
}

export interface EventEmitter {
  on(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface BatchOperation<T> {
  items: T[];
  operation: 'create' | 'update' | 'delete';
  onProgress?: (progress: number) => void;
  onComplete?: (results: any[]) => void;
  onError?: (error: IVIngestionError) => void;
} 