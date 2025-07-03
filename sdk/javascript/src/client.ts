import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { EventEmitter } from 'events';
import {
  IVIngestionConfig,
  ApiResponse,
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  FileUploadRequest,
  FileUploadResponse,
  FileStatus,
  Inspection,
  InspectionDetail,
  InspectionsListRequest,
  InspectionsListResponse,
  WebhookCreateRequest,
  Webhook,
  WebhooksListResponse,
  AdminMetrics,
  AdminQueuesResponse,
  HealthStatus,
  UploadProgress,
  ProcessingProgress,
  IVIngestionError,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RateLimitInfo,
  BatchOperation
} from './types';

/**
 * Main IV Ingestion SDK Client
 * Provides comprehensive API access with automatic retry, rate limiting, and real-time features
 */
export class IVIngestionClient extends EventEmitter {
  private config: Required<IVIngestionConfig>;
  private httpClient: AxiosInstance;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private rateLimitInfo: RateLimitInfo | null = null;
  private processingStatus: Map<string, ProcessingProgress> = new Map();

  constructor(config: IVIngestionConfig = {}) {
    super();
    
    // Set default configuration
    this.config = {
      baseURL: config.baseURL || 'https://api.iv-ingestion.com/v1',
      apiKey: config.apiKey || '',
      token: config.token || '',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      debug: config.debug || false,
      headers: config.headers || {}
    };

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'IV-Ingestion-SDK/1.0.0',
        ...this.config.headers
      }
    });

    // Set up request/response interceptors
    this.setupInterceptors();
  }

  /**
   * Set up HTTP interceptors for authentication, logging, and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        // Add authentication headers
        if (this.config.token) {
          config.headers.Authorization = `Bearer ${this.config.token}`;
        } else if (this.config.apiKey) {
          config.headers['X-API-Key'] = this.config.apiKey;
        }

        // Add rate limit headers
        if (this.rateLimitInfo) {
          config.headers['X-RateLimit-Limit'] = this.rateLimitInfo.limit.toString();
          config.headers['X-RateLimit-Remaining'] = this.rateLimitInfo.remaining.toString();
          config.headers['X-RateLimit-Reset'] = this.rateLimitInfo.reset.toString();
        }

        // Apply custom request interceptors
        for (const interceptor of this.requestInterceptors) {
          config = interceptor(config);
        }

        if (this.config.debug) {
          console.log(`[IV Ingestion SDK] Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        if (this.config.debug) {
          console.error('[IV Ingestion SDK] Request error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => {
        // Extract rate limit information
        this.extractRateLimitInfo(response);

        // Apply custom response interceptors
        for (const interceptor of this.responseInterceptors) {
          response = interceptor(response);
        }

        if (this.config.debug) {
          console.log(`[IV Ingestion SDK] Response: ${response.status} ${response.config.url}`);
        }

        return response;
      },
      async (error) => {
        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          if (retryAfter) {
            await this.delay(parseInt(retryAfter) * 1000);
            return this.httpClient.request(error.config);
          }
        }

        // Apply custom error interceptors
        for (const interceptor of this.errorInterceptors) {
          const result = interceptor(this.createError(error));
          if (result) return result;
        }

        if (this.config.debug) {
          console.error('[IV Ingestion SDK] Response error:', error);
        }

        return Promise.reject(this.createError(error));
      }
    );
  }

  /**
   * Extract rate limit information from response headers
   */
  private extractRateLimitInfo(response: AxiosResponse): void {
    const limit = response.headers['x-ratelimit-limit'];
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    const retryAfter = response.headers['retry-after'];

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined
      };
    }
  }

  /**
   * Create standardized error object
   */
  private createError(error: any): IVIngestionError {
    const message = error.response?.data?.error || error.message || 'Unknown error';
    const code = error.response?.data?.code || error.code || 'UNKNOWN_ERROR';
    const status = error.response?.status || 0;
    const details = error.response?.data?.details || [];

    return new IVIngestionError(message, code, status, details);
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  public addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Set authentication token
   */
  public setToken(token: string): void {
    this.config.token = token;
  }

  /**
   * Set API key
   */
  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Get current rate limit information
   */
  public getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Health check
   */
  public async health(): Promise<HealthStatus> {
    const response = await this.httpClient.get<ApiResponse<HealthStatus>>('/health');
    return response.data.data!;
  }

  /**
   * User authentication
   */
  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.httpClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    const result = response.data.data!;
    
    // Store token for future requests
    this.setToken(result.token);
    
    return result;
  }

  /**
   * User registration
   */
  public async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await this.httpClient.post<ApiResponse<LoginResponse>>('/auth/register', userData);
    const result = response.data.data!;
    
    // Store token for future requests
    this.setToken(result.token);
    
    return result;
  }

  /**
   * Get current user profile
   */
  public async getCurrentUser(): Promise<User> {
    const response = await this.httpClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  }

  /**
   * Upload file with progress tracking
   */
  public async uploadFile(
    fileData: FileUploadRequest,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    
    // Add file
    if (fileData.file instanceof File) {
      formData.append('file', fileData.file);
    } else {
      formData.append('file', fileData.file, 'uploaded-file');
    }
    
    // Add metadata
    if (fileData.metadata) {
      formData.append('metadata', JSON.stringify(fileData.metadata));
    }

    const startTime = Date.now();
    let lastProgressTime = startTime;

    const response = await this.httpClient.post<ApiResponse<FileUploadResponse>>('/files/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const currentTime = Date.now();
          const timeElapsed = currentTime - startTime;
          const loaded = progressEvent.loaded;
          const total = progressEvent.total;
          const percentage = (loaded / total) * 100;
          const speed = loaded / (timeElapsed / 1000);
          const estimatedTime = timeElapsed > 0 ? (total - loaded) / speed * 1000 : 0;

          onProgress({
            loaded,
            total,
            percentage,
            speed,
            estimatedTime
          });

          lastProgressTime = currentTime;
        }
      }
    });

    const result = response.data.data!;
    
    // Start monitoring processing status
    this.monitorProcessing(result.fileId);
    
    return result;
  }

  /**
   * Get file processing status
   */
  public async getFileStatus(fileId: string): Promise<FileStatus> {
    const response = await this.httpClient.get<ApiResponse<FileStatus>>(`/files/${fileId}`);
    return response.data.data!;
  }

  /**
   * Download processed file
   */
  public async downloadFile(fileId: string): Promise<Buffer> {
    const response = await this.httpClient.get(`/files/${fileId}/download`, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  }

  /**
   * List inspections with filtering and pagination
   */
  public async listInspections(params: InspectionsListRequest = {}): Promise<InspectionsListResponse> {
    const response = await this.httpClient.get<ApiResponse<InspectionsListResponse>>('/inspections', {
      params
    });
    return response.data.data!;
  }

  /**
   * Get inspection details
   */
  public async getInspection(inspectionId: string): Promise<InspectionDetail> {
    const response = await this.httpClient.get<ApiResponse<InspectionDetail>>(`/inspections/${inspectionId}`);
    return response.data.data!;
  }

  /**
   * Create webhook
   */
  public async createWebhook(webhookData: WebhookCreateRequest): Promise<Webhook> {
    const response = await this.httpClient.post<ApiResponse<Webhook>>('/webhooks', webhookData);
    return response.data.data!;
  }

  /**
   * List webhooks
   */
  public async listWebhooks(): Promise<WebhooksListResponse> {
    const response = await this.httpClient.get<ApiResponse<WebhooksListResponse>>('/webhooks');
    return response.data.data!;
  }

  /**
   * Delete webhook
   */
  public async deleteWebhook(webhookId: string): Promise<void> {
    await this.httpClient.delete(`/webhooks/${webhookId}`);
  }

  /**
   * Get admin metrics (admin access required)
   */
  public async getAdminMetrics(): Promise<AdminMetrics> {
    const response = await this.httpClient.get<ApiResponse<AdminMetrics>>('/admin/metrics');
    return response.data.data!;
  }

  /**
   * Get queue status (admin access required)
   */
  public async getQueueStatus(): Promise<AdminQueuesResponse> {
    const response = await this.httpClient.get<ApiResponse<AdminQueuesResponse>>('/admin/queues');
    return response.data.data!;
  }

  /**
   * Monitor file processing status in real-time
   */
  private async monitorProcessing(fileId: string): Promise<void> {
    const pollInterval = 2000; // 2 seconds
    const maxAttempts = 300; // 10 minutes max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const status = await this.getFileStatus(fileId);
        
        // Update processing status
        this.processingStatus.set(fileId, {
          fileId,
          status: status.status,
          progress: status.progress,
          currentStep: this.getCurrentStep(status.status, status.progress),
          estimatedTimeRemaining: this.calculateEstimatedTime(status.progress, pollInterval)
        });

        // Emit progress event
        this.emit('processing:progress', this.processingStatus.get(fileId));

        if (status.status === 'completed' || status.status === 'failed') {
          this.emit('processing:complete', status);
          this.processingStatus.delete(fileId);
          return;
        }

        if (attempts >= maxAttempts) {
          this.emit('processing:timeout', { fileId });
          this.processingStatus.delete(fileId);
          return;
        }

        attempts++;
        setTimeout(poll, pollInterval);
      } catch (error) {
        this.emit('processing:error', { fileId, error: this.createError(error) });
        this.processingStatus.delete(fileId);
      }
    };

    poll();
  }

  /**
   * Get current processing step description
   */
  private getCurrentStep(status: string, progress: number): string {
    switch (status) {
      case 'uploaded':
        return 'File uploaded, waiting for processing';
      case 'processing':
        if (progress < 25) return 'Extracting text and data';
        if (progress < 50) return 'Analyzing inspection findings';
        if (progress < 75) return 'Categorizing and prioritizing issues';
        if (progress < 100) return 'Generating final report';
        return 'Finalizing processing';
      case 'completed':
        return 'Processing completed';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTime(progress: number, pollInterval: number): number {
    if (progress <= 0) return 0;
    const remainingProgress = 100 - progress;
    const timePerPercent = pollInterval / progress;
    return remainingProgress * timePerPercent;
  }

  /**
   * Get current processing status for a file
   */
  public getProcessingStatus(fileId: string): ProcessingProgress | undefined {
    return this.processingStatus.get(fileId);
  }

  /**
   * Get all active processing statuses
   */
  public getAllProcessingStatuses(): ProcessingProgress[] {
    return Array.from(this.processingStatus.values());
  }

  /**
   * Batch operations support
   */
  public async batchUpload<T extends FileUploadRequest>(
    operations: BatchOperation<T>
  ): Promise<any[]> {
    const results: any[] = [];
    const total = operations.items.length;

    for (let i = 0; i < total; i++) {
      try {
        const result = await this.uploadFile(operations.items[i]);
        results.push(result);
        
        if (operations.onProgress) {
          operations.onProgress((i + 1) / total * 100);
        }
      } catch (error) {
        if (operations.onError) {
          operations.onError(this.createError(error));
        }
        results.push({ error: this.createError(error) });
      }
    }

    if (operations.onComplete) {
      operations.onComplete(results);
    }

    return results;
  }

  /**
   * Verify webhook signature
   */
  public verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
} 