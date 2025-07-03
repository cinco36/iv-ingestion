"""
Data models for IV Ingestion SDK
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, validator
import hashlib
import hmac


class UserRole(str, Enum):
    """User roles"""
    USER = "user"
    ADMIN = "admin"
    INSPECTOR = "inspector"


class FileStatus(str, Enum):
    """File processing status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FindingCategory(str, Enum):
    """Finding categories"""
    ELECTRICAL = "electrical"
    PLUMBING = "plumbing"
    STRUCTURAL = "structural"
    HVAC = "hvac"
    ROOFING = "roofing"
    INTERIOR = "interior"
    EXTERIOR = "exterior"
    SAFETY = "safety"
    OTHER = "other"


class FindingSeverity(str, Enum):
    """Finding severity levels"""
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"


class InspectionStatus(str, Enum):
    """Inspection status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PropertyType(str, Enum):
    """Property types"""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"


class WebhookEventType(str, Enum):
    """Webhook event types"""
    PROCESSING_STARTED = "processing.started"
    PROCESSING_PROGRESS = "processing.progress"
    PROCESSING_COMPLETED = "processing.completed"
    PROCESSING_FAILED = "processing.failed"
    INSPECTION_CREATED = "inspection.created"
    INSPECTION_UPDATED = "inspection.updated"
    FINDING_ADDED = "finding.added"
    USER_REGISTERED = "user.registered"


class HealthStatus(str, Enum):
    """System health status"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class QueueWorkerStatus(str, Enum):
    """Queue worker status"""
    IDLE = "idle"
    WORKING = "working"
    ERROR = "error"


class QueueTrend(str, Enum):
    """Queue trend"""
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"


class BaseResponse(BaseModel):
    """Base API response"""
    success: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class User(BaseModel):
    """User model"""
    id: str
    email: str = Field(..., description="User email address")
    first_name: str = Field(..., alias="firstName")
    last_name: str = Field(..., alias="lastName")
    role: UserRole
    is_email_verified: bool = Field(..., alias="isEmailVerified")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    class Config:
        allow_population_by_field_name = True


class LoginRequest(BaseModel):
    """Login request"""
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")
    remember_me: Optional[bool] = Field(False, alias="rememberMe")

    class Config:
        allow_population_by_field_name = True


class LoginResponse(BaseResponse):
    """Login response"""
    data: Dict[str, Any] = Field(..., description="Login data containing user and tokens")


class RegisterRequest(BaseModel):
    """Registration request"""
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")
    first_name: str = Field(..., alias="firstName")
    last_name: str = Field(..., alias="lastName")
    confirm_password: str = Field(..., alias="confirmPassword")

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

    class Config:
        allow_population_by_field_name = True


class FileUploadResponse(BaseResponse):
    """File upload response"""
    data: Dict[str, Any] = Field(..., description="File upload data")


class FileStatus(BaseResponse):
    """File status response"""
    data: Dict[str, Any] = Field(..., description="File status data")


class Finding(BaseModel):
    """Finding model"""
    id: str
    category: FindingCategory
    severity: FindingSeverity
    title: str
    description: str
    location: str
    estimated_cost: Optional[float] = Field(None, alias="estimatedCost")
    priority: int = Field(..., ge=1, le=10, description="Priority level 1-10")

    class Config:
        allow_population_by_field_name = True


class Property(BaseModel):
    """Property model"""
    id: str
    address: str
    city: str
    state: str
    zip_code: str = Field(..., alias="zipCode")
    property_type: PropertyType = Field(..., alias="propertyType")
    square_footage: Optional[int] = Field(None, alias="squareFootage")
    year_built: Optional[int] = Field(None, alias="yearBuilt")

    class Config:
        allow_population_by_field_name = True


class Inspection(BaseModel):
    """Inspection model"""
    id: str
    property_id: str = Field(..., alias="propertyId")
    status: InspectionStatus
    inspection_date: datetime = Field(..., alias="inspectionDate")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")
    findings_count: int = Field(..., alias="findingsCount")
    critical_findings: int = Field(..., alias="criticalFindings")
    major_findings: int = Field(..., alias="majorFindings")
    minor_findings: int = Field(..., alias="minorFindings")
    estimated_cost: float = Field(..., alias="estimatedCost")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    class Config:
        allow_population_by_field_name = True


class InspectionDetail(Inspection):
    """Detailed inspection with findings and property"""
    findings: List[Finding]
    property: Property


class InspectionsListResponse(BaseResponse):
    """Inspections list response"""
    data: Dict[str, Any] = Field(..., description="Inspections list data")


class Webhook(BaseModel):
    """Webhook model"""
    id: str
    url: str
    events: List[WebhookEventType]
    description: Optional[str]
    is_active: bool = Field(..., alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")
    last_triggered: Optional[datetime] = Field(None, alias="lastTriggered")

    class Config:
        allow_population_by_field_name = True


class WebhookCreateRequest(BaseModel):
    """Webhook creation request"""
    url: str = Field(..., description="Webhook endpoint URL")
    events: List[WebhookEventType] = Field(..., description="Events to subscribe to")
    description: Optional[str] = Field(None, description="Optional description")

    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v


class WebhooksListResponse(BaseResponse):
    """Webhooks list response"""
    data: Dict[str, Any] = Field(..., description="Webhooks list data")


class HealthStatusResponse(BaseResponse):
    """Health status response"""
    data: Dict[str, Any] = Field(..., description="Health status data")


class UploadProgress(BaseModel):
    """Upload progress model"""
    loaded: int
    total: int
    percentage: float = Field(..., ge=0, le=100)
    speed: float  # bytes per second
    estimated_time: float = Field(..., alias="estimatedTime")  # seconds

    class Config:
        allow_population_by_field_name = True


class ProcessingProgress(BaseModel):
    """Processing progress model"""
    file_id: str = Field(..., alias="fileId")
    status: FileStatus
    progress: float = Field(..., ge=0, le=100)
    current_step: str = Field(..., alias="currentStep")
    estimated_time_remaining: float = Field(..., alias="estimatedTimeRemaining")  # seconds

    class Config:
        allow_population_by_field_name = True


class QueueWorker(BaseModel):
    """Queue worker model"""
    id: str
    status: QueueWorkerStatus
    current_job: Optional[str] = Field(None, alias="currentJob")
    processed_jobs: int = Field(..., alias="processedJobs")
    failed_jobs: int = Field(..., alias="failedJobs")
    uptime: int  # seconds
    last_heartbeat: datetime = Field(..., alias="lastHeartbeat")

    class Config:
        allow_population_by_field_name = True


class QueueStatus(BaseModel):
    """Queue status model"""
    name: str
    waiting: int
    active: int
    completed: int
    failed: int
    delayed: int
    workers: List[QueueWorker]


class AdminMetrics(BaseModel):
    """Admin metrics model"""
    files_processed: Dict[str, int] = Field(..., alias="filesProcessed")
    queue_depth: Dict[str, Union[int, str]] = Field(..., alias="queueDepth")
    error_rate: Dict[str, Union[float, str]] = Field(..., alias="errorRate")
    active_users: Dict[str, int] = Field(..., alias="activeUsers")
    processing_rate: Dict[str, int] = Field(..., alias="processingRate")

    class Config:
        allow_population_by_field_name = True


class AdminQueuesResponse(BaseResponse):
    """Admin queues response"""
    data: List[QueueStatus] = Field(..., description="Queue status data")


class Pagination(BaseModel):
    """Pagination model"""
    page: int
    limit: int
    total: int
    total_pages: int = Field(..., alias="totalPages")

    class Config:
        allow_population_by_field_name = True


class WebhookPayload(BaseModel):
    """Webhook payload model"""
    event: WebhookEventType
    timestamp: datetime
    data: Dict[str, Any]
    signature: Optional[str] = None

    def verify_signature(self, secret: str) -> bool:
        """Verify webhook signature"""
        if not self.signature:
            return False
        
        # Create expected signature
        payload = self.json(exclude={'signature'})
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(self.signature, expected_signature)


class RateLimitInfo(BaseModel):
    """Rate limit information"""
    limit: int
    remaining: int
    reset: int
    retry_after: Optional[int] = Field(None, alias="retryAfter")

    class Config:
        allow_population_by_field_name = True


class ErrorDetails(BaseModel):
    """Error details"""
    field: Optional[str] = None
    message: str
    code: Optional[str] = None


class IVIngestionError(Exception):
    """Custom exception for IV Ingestion API errors"""
    
    def __init__(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        status: int = 0,
        details: Optional[List[ErrorDetails]] = None
    ):
        self.message = message
        self.code = code
        self.status = status
        self.details = details or []
        super().__init__(self.message)

    def __str__(self) -> str:
        return f"{self.code} ({self.status}): {self.message}"

    def __repr__(self) -> str:
        return f"IVIngestionError(code='{self.code}', status={self.status}, message='{self.message}')" 