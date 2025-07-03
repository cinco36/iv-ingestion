# IV Ingestion API Documentation

## Overview

The IV Ingestion API provides comprehensive home inspection data processing and management capabilities. This RESTful API supports file upload, real-time processing, webhook notifications, and user management.

## Base URL

- **Production**: `https://api.iv-ingestion.com/v1`
- **Staging**: `https://staging-api.iv-ingestion.com/v1`
- **Development**: `http://localhost:3000/api`

## Authentication

The API supports two authentication methods:

### JWT Tokens (Recommended for Web Applications)

```bash
# Login to get JWT token
curl -X POST https://api.iv-ingestion.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.iv-ingestion.com/v1/auth/me
```

### API Keys (Recommended for Server-to-Server)

```bash
# Use API key in headers
curl -H "X-API-Key: YOUR_API_KEY" \
  https://api.iv-ingestion.com/v1/health
```

## Rate Limiting

The API implements tiered rate limiting:

| Tier | API Requests | File Uploads | Window |
|------|-------------|--------------|---------|
| Free | 100 | 10 | 15 min / 24 hours |
| Pro | 1,000 | 100 | 15 min / 24 hours |
| Enterprise | 10,000 | 1,000 | 15 min / 24 hours |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200000
```

When limits are exceeded, a `429 Too Many Requests` response is returned:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 1000,
    "remaining": 0,
    "reset": 1640995200000,
    "retryAfter": 900
  }
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "additional_info"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Endpoints

### Authentication

#### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isEmailVerified": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

#### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "confirmPassword": "password123"
}
```

#### GET /auth/me

Get current user profile (requires authentication).

### File Management

#### POST /files/upload

Upload a file for processing.

**Request:**
```bash
curl -X POST https://api.iv-ingestion.com/v1/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@inspection.pdf" \
  -F "metadata={\"propertyId\": \"123\", \"inspectionType\": \"residential\"}"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_12345",
    "filename": "inspection-report.pdf",
    "size": 1024000,
    "status": "uploaded",
    "processingJobId": "job_67890",
    "estimatedProcessingTime": 30
  }
}
```

#### GET /files/{fileId}

Get file processing status.

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_12345",
    "filename": "inspection-report.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "status": "processing",
    "progress": 45,
    "uploadedAt": "2025-01-01T00:00:00.000Z",
    "processedAt": null,
    "processingTime": null,
    "findings": []
  }
}
```

#### GET /files/{fileId}/download

Download processed file.

### Inspections

#### GET /inspections

List inspections with filtering and pagination.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20, max: 100)
- `status` (string) - Filter by status: `pending`, `processing`, `completed`, `failed`
- `dateFrom` (string) - Filter by start date (YYYY-MM-DD)
- `dateTo` (string) - Filter by end date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "inspections": [
      {
        "id": "insp_123",
        "propertyId": "prop_456",
        "status": "completed",
        "inspectionDate": "2025-01-01",
        "completedAt": "2025-01-01T00:30:00.000Z",
        "findingsCount": 15,
        "criticalFindings": 2,
        "majorFindings": 5,
        "minorFindings": 8,
        "estimatedCost": 25000,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### GET /inspections/{inspectionId}

Get detailed inspection information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "insp_123",
    "propertyId": "prop_456",
    "status": "completed",
    "inspectionDate": "2025-01-01",
    "completedAt": "2025-01-01T00:30:00.000Z",
    "findingsCount": 15,
    "criticalFindings": 2,
    "majorFindings": 5,
    "minorFindings": 8,
    "estimatedCost": 25000,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:30:00.000Z",
    "findings": [
      {
        "id": "find_789",
        "category": "electrical",
        "severity": "critical",
        "title": "Faulty Electrical Panel",
        "description": "The main electrical panel shows signs of overheating...",
        "location": "Basement",
        "estimatedCost": 5000,
        "priority": 10
      }
    ],
    "property": {
      "id": "prop_456",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "90210",
      "propertyType": "residential",
      "squareFootage": 2500,
      "yearBuilt": 1995
    }
  }
}
```

### Webhooks

#### GET /webhooks

List user's webhook configurations.

#### POST /webhooks

Register a new webhook endpoint.

**Request:**
```json
{
  "url": "https://myapp.com/webhooks/processing",
  "events": ["processing.started", "processing.completed", "processing.failed"],
  "description": "Processing status updates"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wh_12345",
    "url": "https://myapp.com/webhooks/processing",
    "events": ["processing.started", "processing.completed", "processing.failed"],
    "description": "Processing status updates",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastTriggered": null
  }
}
```

#### DELETE /webhooks/{webhookId}

Remove a webhook endpoint.

### Admin Endpoints

#### GET /admin/metrics

Get system performance metrics (admin access required).

**Response:**
```json
{
  "success": true,
  "data": {
    "filesProcessed": {
      "today": 45,
      "yesterday": 38,
      "total": 1234
    },
    "queueDepth": {
      "current": 12,
      "average": 8,
      "trend": "stable"
    },
    "errorRate": {
      "current": 2.1,
      "average": 1.8,
      "trend": "decreasing"
    },
    "activeUsers": {
      "current": 5,
      "total": 25
    },
    "processingRate": {
      "perHour": 15,
      "perDay": 360
    }
  }
}
```

#### GET /admin/queues

Get processing queue status (admin access required).

## Webhook Events

When webhook events are triggered, a POST request is sent to your webhook URL with the following payload:

```json
{
  "event": "processing.completed",
  "timestamp": "2025-01-01T00:30:00.000Z",
  "data": {
    "fileId": "file_12345",
    "status": "completed",
    "findingsCount": 15,
    "processingTime": 1800000
  },
  "id": "evt_67890"
}
```

### Event Types

- `processing.started` - File processing initiated
- `processing.progress` - Processing progress updates
- `processing.completed` - File successfully processed
- `processing.failed` - Processing encountered error
- `inspection.created` - New inspection record created
- `inspection.updated` - Inspection data modified
- `finding.added` - New finding discovered
- `user.registered` - New user account created

### Webhook Security

Each webhook delivery includes an HMAC-SHA256 signature in the `X-Webhook-Signature` header. Verify the signature to ensure the webhook is authentic:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

## SDK Usage

### JavaScript/TypeScript SDK

```javascript
import { IVIngestionClient } from '@iv-ingestion/sdk';

const client = new IVIngestionClient({
  baseURL: 'https://api.iv-ingestion.com/v1',
  apiKey: 'your-api-key'
});

// Upload a file
const result = await client.uploadFile({
  file: fileBuffer,
  metadata: { propertyId: '123' }
});

// Monitor processing
client.on('processing:progress', (progress) => {
  console.log(`Processing: ${progress.progress}%`);
});

// Get file status
const status = await client.getFileStatus(result.fileId);
```

### Python SDK

```python
from iv_ingestion import IVIngestionClient

client = IVIngestionClient(
    base_url="https://api.iv-ingestion.com/v1",
    api_key="your-api-key"
)

# Upload a file
with open("inspection.pdf", "rb") as f:
    result = await client.upload_file(
        file=f,
        metadata={"property_id": "123"}
    )

# Monitor processing
async for progress in client.monitor_processing(result.file_id):
    print(f"Processing: {progress.progress}%")
```

## Best Practices

### Error Handling

Always check for errors in API responses:

```javascript
try {
  const response = await client.uploadFile(fileData);
  console.log('Upload successful:', response.fileId);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Handle rate limiting
    await delay(error.details.retryAfter * 1000);
  } else if (error.code === 'FILE_TOO_LARGE') {
    // Handle file size limits
    console.error('File too large');
  } else {
    // Handle other errors
    console.error('Upload failed:', error.message);
  }
}
```

### Rate Limiting

Implement exponential backoff for rate limit errors:

```javascript
async function makeRequestWithRetry(client, requestFn) {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.code === 'RATE_LIMIT_EXCEEDED' && attempts < maxAttempts - 1) {
        const delay = Math.pow(2, attempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
        continue;
      }
      throw error;
    }
  }
}
```

### Webhook Security

Always verify webhook signatures:

```javascript
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  console.log('Webhook received:', req.body.event);
  res.status(200).send('OK');
});
```

## Support

For API support and questions:

- **Documentation**: https://docs.iv-ingestion.com
- **API Status**: https://status.iv-ingestion.com
- **Support Email**: support@iv-ingestion.com
- **GitHub Issues**: https://github.com/iv-ingestion/api/issues

## Changelog

### v1.0.0 (2025-01-01)
- Initial API release
- File upload and processing
- Webhook system
- Rate limiting
- User management
- Admin endpoints 