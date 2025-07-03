# API Reference

This document provides a comprehensive reference for the IV Ingestion API endpoints.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

The API supports multiple authentication methods:

### API Key Authentication

```bash
curl -H "X-API-Key: your-api-key" http://localhost:8000/api/v1/health
```

### JWT Authentication

```bash
# Get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "password"}'

# Use token
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/health
```

## Common Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00Z",
  "request_id": "req_123456789"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "request_id": "req_123456789"
}
```

## Health and Status

### Health Check

Check if the service is running.

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 3600,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Service Status

Get detailed service status.

```http
GET /status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ingestion": {
      "is_running": true,
      "last_cycle": "2024-01-01T00:00:00Z",
      "cycles_completed": 100,
      "errors_count": 0
    },
    "database": {
      "connected": true,
      "pool_size": 10,
      "active_connections": 3
    },
    "storage": {
      "type": "local",
      "available_space": "1.5GB",
      "total_records": 10000
    }
  }
}
```

## Ingestion Management

### Start Ingestion

Start the ingestion process.

```http
POST /ingestion/start
```

**Request Body:**
```json
{
  "sources": ["source_1", "source_2"],
  "options": {
    "batch_size": 1000,
    "timeout": 300
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "job_123456789",
    "status": "started",
    "estimated_duration": 1800
  }
}
```

### Stop Ingestion

Stop the ingestion process.

```http
POST /ingestion/stop
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "stopped",
    "stopped_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get Ingestion Status

Get current ingestion status.

```http
GET /ingestion/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_running": true,
    "current_job": {
      "id": "job_123456789",
      "started_at": "2024-01-01T00:00:00Z",
      "progress": 75,
      "records_processed": 7500,
      "errors": 0
    },
    "last_completed": {
      "id": "job_123456788",
      "completed_at": "2024-01-01T00:00:00Z",
      "records_processed": 10000,
      "duration": 1800
    }
  }
}
```

## Data Sources

### List Data Sources

Get all configured data sources.

```http
GET /sources
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "id": "source_1",
        "name": "CSV Source",
        "type": "file",
        "enabled": true,
        "last_sync": "2024-01-01T00:00:00Z",
        "status": "active"
      },
      {
        "id": "source_2",
        "name": "API Source",
        "type": "api",
        "enabled": false,
        "last_sync": null,
        "status": "disabled"
      }
    ]
  }
}
```

### Get Data Source Details

Get detailed information about a specific data source.

```http
GET /sources/{source_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "source_1",
    "name": "CSV Source",
    "type": "file",
    "config": {
      "path": "/path/to/data.csv",
      "format": "csv",
      "delimiter": ",",
      "encoding": "utf-8"
    },
    "validation": {
      "required_columns": ["id", "timestamp", "value"],
      "data_types": {
        "id": "string",
        "timestamp": "datetime",
        "value": "float"
      }
    },
    "enabled": true,
    "last_sync": "2024-01-01T00:00:00Z",
    "sync_stats": {
      "total_records": 10000,
      "successful": 9950,
      "failed": 50,
      "last_error": null
    }
  }
}
```

### Test Data Source

Test connection to a data source.

```http
POST /sources/{source_id}/test
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "sample_data": [
      {
        "id": "1",
        "timestamp": "2024-01-01T00:00:00Z",
        "value": 123.45
      }
    ],
    "total_records": 10000
  }
}
```

## Data Management

### Query Data

Query ingested data with filters.

```http
POST /data/query
```

**Request Body:**
```json
{
  "filters": {
    "source": "source_1",
    "date_range": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-02T00:00:00Z"
    },
    "value_range": {
      "min": 0,
      "max": 1000
    }
  },
  "pagination": {
    "page": 1,
    "limit": 100
  },
  "sort": {
    "field": "timestamp",
    "order": "desc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "1",
        "source": "source_1",
        "timestamp": "2024-01-01T00:00:00Z",
        "value": 123.45,
        "metadata": {}
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 10000,
      "pages": 100
    }
  }
}
```

### Export Data

Export data in various formats.

```http
POST /data/export
```

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "source": "source_1",
    "date_range": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-02T00:00:00Z"
    }
  },
  "columns": ["id", "timestamp", "value"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "export_id": "export_123456789",
    "status": "processing",
    "estimated_completion": "2024-01-01T00:05:00Z",
    "download_url": "/api/v1/data/export/export_123456789/download"
  }
}
```

### Get Export Status

Check export job status.

```http
GET /data/export/{export_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "export_id": "export_123456789",
    "status": "completed",
    "progress": 100,
    "file_size": "2.5MB",
    "download_url": "/api/v1/data/export/export_123456789/download",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}
```

## Configuration Management

### Get Configuration

Get current configuration.

```http
GET /config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ingestion": {
      "interval": 60,
      "batch_size": 1000,
      "max_workers": 4
    },
    "database": {
      "host": "localhost",
      "port": 5432,
      "name": "iv_ingestion"
    },
    "storage": {
      "type": "local",
      "path": "./data"
    }
  }
}
```

### Update Configuration

Update configuration settings.

```http
PUT /config
```

**Request Body:**
```json
{
  "ingestion": {
    "interval": 120,
    "batch_size": 2000
  },
  "storage": {
    "retention_days": 60
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Configuration updated successfully",
    "restart_required": true
  }
}
```

## Monitoring and Metrics

### Get Metrics

Get system metrics.

```http
GET /metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "system": {
      "cpu_usage": 25.5,
      "memory_usage": 512,
      "disk_usage": 1024
    },
    "ingestion": {
      "records_per_second": 100,
      "error_rate": 0.01,
      "active_jobs": 2
    },
    "database": {
      "connections": 5,
      "query_time": 0.05
    }
  }
}
```

### Get Logs

Get application logs.

```http
GET /logs
```

**Query Parameters:**
- `level`: Filter by log level (DEBUG, INFO, WARNING, ERROR)
- `source`: Filter by source
- `start_time`: Start time filter
- `end_time`: End time filter
- `limit`: Number of log entries to return

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "level": "INFO",
        "source": "ingestion_manager",
        "message": "Ingestion cycle completed",
        "metadata": {}
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 1000
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

## Rate Limiting

The API implements rate limiting:

- **Default**: 1000 requests per minute per IP
- **Authentication endpoints**: 10 requests per minute per IP
- **Data export endpoints**: 10 requests per minute per user

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 100, max: 1000)

**Response Headers:**
```
X-Pagination-Page: 1
X-Pagination-Limit: 100
X-Pagination-Total: 10000
X-Pagination-Pages: 100
```

## Webhooks

Configure webhooks for real-time notifications.

### Create Webhook

```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["ingestion.completed", "ingestion.failed"],
  "secret": "webhook-secret"
}
```

### List Webhooks

```http
GET /webhooks
```

### Delete Webhook

```http
DELETE /webhooks/{webhook_id}
```

## SDK Examples

### Python SDK

```python
from iv_ingestion import IVIngestionClient

client = IVIngestionClient(
    base_url="http://localhost:8000/api/v1",
    api_key="your-api-key"
)

# Start ingestion
response = client.ingestion.start()
print(f"Job ID: {response['data']['job_id']}")

# Query data
data = client.data.query(
    filters={"source": "source_1"},
    pagination={"page": 1, "limit": 100}
)
print(f"Found {len(data['data']['records'])} records")
```

### JavaScript SDK

```javascript
import { IVIngestionClient } from '@iv-ingestion/client';

const client = new IVIngestionClient({
  baseUrl: 'http://localhost:8000/api/v1',
  apiKey: 'your-api-key'
});

// Start ingestion
const response = await client.ingestion.start();
console.log(`Job ID: ${response.data.job_id}`);

// Query data
const data = await client.data.query({
  filters: { source: 'source_1' },
  pagination: { page: 1, limit: 100 }
});
console.log(`Found ${data.data.records.length} records`);
```

## Next Steps

- Review the [Configuration Guide](configuration.md) for setup instructions
- Check the [Development Guide](development.md) for contribution guidelines
- See the [Troubleshooting Guide](troubleshooting.md) for common issues 