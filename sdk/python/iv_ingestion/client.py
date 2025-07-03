"""
IV Ingestion Python SDK Client

Main client implementation for the IV Ingestion API
"""

import asyncio
import hashlib
import hmac
import json
import time
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional, Union
from urllib.parse import urljoin

import aiohttp
import aiofiles
from aiohttp import ClientSession, ClientTimeout
from aiohttp.client_reqrep import ClientResponse

from .models import (
    AdminMetrics,
    AdminQueuesResponse,
    FileStatus,
    FileUploadResponse,
    Finding,
    HealthStatusResponse,
    InspectionDetail,
    InspectionsListResponse,
    IVIngestionError,
    LoginRequest,
    LoginResponse,
    ProcessingProgress,
    RegisterRequest,
    UploadProgress,
    User,
    Webhook,
    WebhookCreateRequest,
    WebhooksListResponse,
    WebhookPayload,
    RateLimitInfo,
)


class IVIngestionConfig:
    """Configuration for IV Ingestion client"""
    
    def __init__(
        self,
        base_url: str = "https://api.iv-ingestion.com/v1",
        api_key: Optional[str] = None,
        token: Optional[str] = None,
        timeout: int = 30,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        debug: bool = False,
        headers: Optional[Dict[str, str]] = None,
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.token = token
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.debug = debug
        self.headers = headers or {}


class IVIngestionClient:
    """
    Main IV Ingestion SDK Client
    
    Provides comprehensive API access with automatic retry, rate limiting,
    and real-time features.
    """
    
    def __init__(self, config: Optional[IVIngestionConfig] = None):
        self.config = config or IVIngestionConfig()
        self._session: Optional[ClientSession] = None
        self._rate_limit_info: Optional[RateLimitInfo] = None
        self._processing_status: Dict[str, ProcessingProgress] = {}
        
    async def __aenter__(self):
        """Async context manager entry"""
        await self._ensure_session()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
        
    async def _ensure_session(self):
        """Ensure HTTP session is created"""
        if self._session is None or self._session.closed:
            timeout = ClientTimeout(total=self.config.timeout)
            self._session = ClientSession(
                timeout=timeout,
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'IV-Ingestion-Python-SDK/1.0.0',
                    **self.config.headers
                }
            )
            
    async def close(self):
        """Close the HTTP session"""
        if self._session and not self._session.closed:
            await self._session.close()
            
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        headers = {}
        if self.config.token:
            headers['Authorization'] = f'Bearer {self.config.token}'
        elif self.config.api_key:
            headers['X-API-Key'] = self.config.api_key
        return headers
        
    def _extract_rate_limit_info(self, response: ClientResponse):
        """Extract rate limit information from response headers"""
        limit = response.headers.get('X-RateLimit-Limit')
        remaining = response.headers.get('X-RateLimit-Remaining')
        reset = response.headers.get('X-RateLimit-Reset')
        retry_after = response.headers.get('Retry-After')
        
        if limit and remaining and reset:
            self._rate_limit_info = RateLimitInfo(
                limit=int(limit),
                remaining=int(remaining),
                reset=int(reset),
                retry_after=int(retry_after) if retry_after else None
            )
            
    def _create_error(self, response: ClientResponse, data: Dict[str, Any]) -> IVIngestionError:
        """Create standardized error object"""
        message = data.get('error', 'Unknown error')
        code = data.get('code', 'UNKNOWN_ERROR')
        status = response.status
        details = data.get('details', [])
        
        return IVIngestionError(message, code, status, details)
        
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
        retries: int = 0
    ) -> Dict[str, Any]:
        """Make HTTP request with retry logic"""
        await self._ensure_session()
        
        url = urljoin(self.config.base_url, endpoint)
        headers = self._get_auth_headers()
        
        if self.config.debug:
            print(f"[IV Ingestion SDK] {method.upper()} {url}")
            
        try:
            if files:
                # Handle file upload
                form_data = aiohttp.FormData()
                for key, value in data.items() if data else []:
                    if isinstance(value, dict):
                        form_data.add_field(key, json.dumps(value))
                    else:
                        form_data.add_field(key, str(value))
                        
                for field_name, file_data in files.items():
                    if hasattr(file_data, 'read'):
                        # File-like object
                        form_data.add_field(field_name, file_data)
                    else:
                        # File path or bytes
                        form_data.add_field(field_name, file_data)
                        
                async with self._session.request(method, url, data=form_data, headers=headers) as response:
                    return await self._handle_response(response)
            else:
                # Regular JSON request
                json_data = json.dumps(data) if data else None
                async with self._session.request(method, url, json=data, headers=headers) as response:
                    return await self._handle_response(response)
                    
        except aiohttp.ClientError as e:
            if retries < self.config.max_retries:
                await asyncio.sleep(self.config.retry_delay * (2 ** retries))
                return await self._make_request(method, endpoint, data, files, retries + 1)
            raise IVIngestionError(f"Request failed: {str(e)}", "REQUEST_FAILED")
            
    async def _handle_response(self, response: ClientResponse) -> Dict[str, Any]:
        """Handle HTTP response"""
        self._extract_rate_limit_info(response)
        
        try:
            data = await response.json()
        except:
            data = {'error': 'Invalid JSON response'}
            
        if self.config.debug:
            print(f"[IV Ingestion SDK] Response: {response.status} {response.url}")
            
        if response.status >= 400:
            raise self._create_error(response, data)
            
        return data
        
    def get_rate_limit_info(self) -> Optional[RateLimitInfo]:
        """Get current rate limit information"""
        return self._rate_limit_info
        
    async def health(self) -> HealthStatusResponse:
        """Check API health status"""
        data = await self._make_request('GET', '/health')
        return HealthStatusResponse(**data)
        
    async def login(self, credentials: LoginRequest) -> LoginResponse:
        """Authenticate user and get JWT token"""
        data = await self._make_request('POST', '/auth/login', credentials.dict())
        response = LoginResponse(**data)
        
        # Store token for future requests
        if response.data.get('token'):
            self.config.token = response.data['token']
            
        return response
        
    async def register(self, user_data: RegisterRequest) -> LoginResponse:
        """Register new user account"""
        data = await self._make_request('POST', '/auth/register', user_data.dict())
        response = LoginResponse(**data)
        
        # Store token for future requests
        if response.data.get('token'):
            self.config.token = response.data['token']
            
        return response
        
    async def get_current_user(self) -> User:
        """Get current user profile"""
        data = await self._make_request('GET', '/auth/me')
        return User(**data['data'])
        
    async def upload_file(
        self,
        file_path: str,
        metadata: Optional[Dict[str, Any]] = None,
        on_progress: Optional[callable] = None
    ) -> FileUploadResponse:
        """
        Upload a file for processing
        
        Args:
            file_path: Path to the file to upload
            metadata: Optional metadata for the file
            on_progress: Optional callback for upload progress
            
        Returns:
            FileUploadResponse with file ID and status
        """
        files = {'file': file_path}
        data = {'metadata': json.dumps(metadata)} if metadata else {}
        
        # TODO: Implement upload progress tracking
        # For now, just upload the file
        response_data = await self._make_request('POST', '/files/upload', data, files)
        return FileUploadResponse(**response_data)
        
    async def get_file_status(self, file_id: str) -> FileStatus:
        """Get file processing status"""
        data = await self._make_request('GET', f'/files/{file_id}')
        return FileStatus(**data)
        
    async def download_file(self, file_id: str) -> bytes:
        """Download processed file"""
        await self._ensure_session()
        url = urljoin(self.config.base_url, f'/files/{file_id}/download')
        headers = self._get_auth_headers()
        
        async with self._session.get(url, headers=headers) as response:
            if response.status >= 400:
                data = await response.json()
                raise self._create_error(response, data)
            return await response.read()
            
    async def list_inspections(
        self,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> InspectionsListResponse:
        """List inspections with filtering and pagination"""
        params = {
            'page': page,
            'limit': limit
        }
        if status:
            params['status'] = status
        if date_from:
            params['dateFrom'] = date_from
        if date_to:
            params['dateTo'] = date_to
            
        endpoint = '/inspections?' + '&'.join(f'{k}={v}' for k, v in params.items())
        data = await self._make_request('GET', endpoint)
        return InspectionsListResponse(**data)
        
    async def get_inspection(self, inspection_id: str) -> InspectionDetail:
        """Get detailed inspection information"""
        data = await self._make_request('GET', f'/inspections/{inspection_id}')
        return InspectionDetail(**data['data'])
        
    async def create_webhook(self, webhook_data: WebhookCreateRequest) -> Webhook:
        """Create a new webhook endpoint"""
        data = await self._make_request('POST', '/webhooks', webhook_data.dict())
        return Webhook(**data['data'])
        
    async def list_webhooks(self) -> WebhooksListResponse:
        """List user's webhook configurations"""
        data = await self._make_request('GET', '/webhooks')
        return WebhooksListResponse(**data)
        
    async def delete_webhook(self, webhook_id: str):
        """Delete a webhook endpoint"""
        await self._make_request('DELETE', f'/webhooks/{webhook_id}')
        
    async def get_admin_metrics(self) -> AdminMetrics:
        """Get admin metrics (requires admin privileges)"""
        data = await self._make_request('GET', '/admin/metrics')
        return AdminMetrics(**data['data'])
        
    async def get_queue_status(self) -> AdminQueuesResponse:
        """Get queue status (requires admin privileges)"""
        data = await self._make_request('GET', '/admin/queues')
        return AdminQueuesResponse(**data)
        
    async def monitor_processing(self, file_id: str) -> AsyncGenerator[ProcessingProgress, None]:
        """
        Monitor file processing in real-time
        
        Args:
            file_id: ID of the file to monitor
            
        Yields:
            ProcessingProgress updates
        """
        poll_interval = 2.0  # Start with 2 second intervals
        
        while True:
            try:
                status = await self.get_file_status(file_id)
                progress_data = status.data
                
                progress = ProcessingProgress(
                    file_id=file_id,
                    status=progress_data['status'],
                    progress=progress_data.get('progress', 0),
                    current_step=progress_data.get('currentStep', 'Unknown'),
                    estimated_time_remaining=progress_data.get('estimatedTimeRemaining', 0)
                )
                
                self._processing_status[file_id] = progress
                yield progress
                
                # Stop monitoring if processing is complete
                if progress.status in ['completed', 'failed']:
                    break
                    
                # Adaptive polling interval
                if progress.progress < 10:
                    poll_interval = 2.0
                elif progress.progress < 50:
                    poll_interval = 5.0
                else:
                    poll_interval = 10.0
                    
                await asyncio.sleep(poll_interval)
                
            except Exception as e:
                if self.config.debug:
                    print(f"[IV Ingestion SDK] Monitoring error: {e}")
                await asyncio.sleep(poll_interval)
                
    def get_processing_status(self, file_id: str) -> Optional[ProcessingProgress]:
        """Get cached processing status for a file"""
        return self._processing_status.get(file_id)
        
    def get_all_processing_statuses(self) -> List[ProcessingProgress]:
        """Get all cached processing statuses"""
        return list(self._processing_status.values())
        
    async def batch_upload(
        self,
        files: List[Dict[str, Any]],
        max_concurrent: int = 3
    ) -> List[FileUploadResponse]:
        """
        Upload multiple files concurrently
        
        Args:
            files: List of file data dictionaries
            max_concurrent: Maximum concurrent uploads
            
        Returns:
            List of FileUploadResponse objects
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def upload_single(file_data: Dict[str, Any]) -> FileUploadResponse:
            async with semaphore:
                return await self.upload_file(
                    file_data['file_path'],
                    file_data.get('metadata')
                )
                
        tasks = [upload_single(file_data) for file_data in files]
        return await asyncio.gather(*tasks, return_exceptions=True)
        
    def verify_webhook_signature(
        self,
        payload: str,
        signature: str,
        secret: str
    ) -> bool:
        """
        Verify webhook signature
        
        Args:
            payload: Raw webhook payload
            signature: Webhook signature header
            secret: Webhook secret
            
        Returns:
            True if signature is valid
        """
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(f'sha256={expected_signature}', signature)
        
    def parse_webhook_payload(self, payload: str, signature: str, secret: str) -> WebhookPayload:
        """
        Parse and verify webhook payload
        
        Args:
            payload: Raw webhook payload
            signature: Webhook signature header
            secret: Webhook secret
            
        Returns:
            Parsed WebhookPayload
            
        Raises:
            IVIngestionError: If signature verification fails
        """
        if not self.verify_webhook_signature(payload, signature, secret):
            raise IVIngestionError("Invalid webhook signature", "INVALID_SIGNATURE")
            
        data = json.loads(payload)
        return WebhookPayload(**data) 