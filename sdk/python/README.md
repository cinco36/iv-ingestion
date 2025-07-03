# IV Ingestion Python SDK

Official Python SDK for the IV Ingestion API - Home inspection data processing and management.

## Features

- **Async/Await Support**: Full async support for high-performance applications
- **File Upload & Processing**: Upload and monitor file processing in real-time
- **Webhook Management**: Create and manage webhook endpoints
- **Authentication**: JWT token and API key authentication
- **Rate Limiting**: Built-in rate limit handling and monitoring
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Type Safety**: Full type hints and Pydantic models
- **Real-time Monitoring**: Monitor file processing progress in real-time
- **Batch Operations**: Upload multiple files concurrently
- **Webhook Verification**: Verify webhook signatures for security

## Installation

```bash
pip install iv-ingestion
```

Or install from source:

```bash
git clone https://github.com/iv-ingestion/python-sdk.git
cd python-sdk
pip install -e .
```

## Quick Start

### Basic Usage

```python
import asyncio
from iv_ingestion import IVIngestionClient, IVIngestionConfig

async def main():
    # Initialize client
    config = IVIngestionConfig(
        base_url="https://api.iv-ingestion.com/v1",
        api_key="your-api-key"
    )
    
    async with IVIngestionClient(config) as client:
        # Check API health
        health = await client.health()
        print(f"API Status: {health.data['status']}")
        
        # Upload a file
        result = await client.upload_file(
            file_path="inspection.pdf",
            metadata={"property_id": "123", "inspection_type": "residential"}
        )
        print(f"File uploaded: {result.data['file_id']}")
        
        # Monitor processing
        async for progress in client.monitor_processing(result.data['file_id']):
            print(f"Processing: {progress.progress}% - {progress.current_step}")

# Run the example
asyncio.run(main())
```

### Authentication

#### API Key Authentication (Recommended for Server Applications)

```python
from iv_ingestion import IVIngestionClient, IVIngestionConfig

config = IVIngestionConfig(
    base_url="https://api.iv-ingestion.com/v1",
    api_key="your-api-key-here"
)

client = IVIngestionClient(config)
```

#### JWT Token Authentication (Recommended for Web Applications)

```python
from iv_ingestion import IVIngestionClient, IVIngestionConfig, LoginRequest

async def authenticate_user():
    config = IVIngestionConfig(base_url="https://api.iv-ingestion.com/v1")
    client = IVIngestionClient(config)
    
    # Login to get JWT token
    credentials = LoginRequest(
        email="user@example.com",
        password="password123"
    )
    
    response = await client.login(credentials)
    print(f"Authenticated as: {response.data['user']['email']}")
    
    # Token is automatically stored for future requests
    return client
```

## Configuration

### IVIngestionConfig Options

```python
from iv_ingestion import IVIngestionConfig

config = IVIngestionConfig(
    base_url="https://api.iv-ingestion.com/v1",  # API base URL
    api_key="your-api-key",                      # API key for authentication
    token="jwt-token",                           # JWT token for authentication
    timeout=30,                                  # Request timeout in seconds
    max_retries=3,                               # Maximum retry attempts
    retry_delay=1.0,                             # Base retry delay in seconds
    debug=False,                                 # Enable debug logging
    headers={                                    # Custom headers
        "X-Custom-Header": "value"
    }
)
```

## File Management

### Upload Files

```python
# Upload a single file
result = await client.upload_file(
    file_path="inspection.pdf",
    metadata={
        "property_id": "123",
        "inspection_type": "residential",
        "inspector": "John Doe"
    }
)

print(f"File ID: {result.data['file_id']}")
print(f"Status: {result.data['status']}")
```

### Monitor Processing

```python
# Monitor file processing in real-time
async for progress in client.monitor_processing(file_id):
    print(f"Status: {progress.status}")
    print(f"Progress: {progress.progress}%")
    print(f"Current Step: {progress.current_step}")
    print(f"Estimated Time Remaining: {progress.estimated_time_remaining}s")
    
    if progress.status in ['completed', 'failed']:
        break
```

### Get File Status

```python
# Get current file status
status = await client.get_file_status(file_id)
print(f"File: {status.data['filename']}")
print(f"Status: {status.data['status']}")
print(f"Progress: {status.data.get('progress', 0)}%")
```

### Download Processed Files

```python
# Download processed file
file_data = await client.download_file(file_id)

# Save to local file
with open("processed_inspection.pdf", "wb") as f:
    f.write(file_data)
```

### Batch Upload

```python
# Upload multiple files concurrently
files = [
    {"file_path": "inspection1.pdf", "metadata": {"property_id": "123"}},
    {"file_path": "inspection2.pdf", "metadata": {"property_id": "124"}},
    {"file_path": "inspection3.pdf", "metadata": {"property_id": "125"}}
]

results = await client.batch_upload(files, max_concurrent=3)

for result in results:
    if isinstance(result, Exception):
        print(f"Upload failed: {result}")
    else:
        print(f"Uploaded: {result.data['file_id']}")
```

## Inspection Management

### List Inspections

```python
# Get inspections with filtering and pagination
inspections = await client.list_inspections(
    page=1,
    limit=20,
    status="completed",
    date_from="2025-01-01",
    date_to="2025-01-31"
)

print(f"Total inspections: {inspections.data['pagination']['total']}")
for inspection in inspections.data['inspections']:
    print(f"Inspection {inspection['id']}: {inspection['status']}")
```

### Get Inspection Details

```python
# Get detailed inspection information
inspection = await client.get_inspection(inspection_id)

print(f"Property: {inspection.property.address}")
print(f"Findings: {len(inspection.findings)}")
print(f"Critical Findings: {inspection.critical_findings}")

for finding in inspection.findings:
    print(f"- {finding.title} ({finding.severity})")
```

## Webhook Management

### Create Webhook

```python
from iv_ingestion import WebhookCreateRequest, WebhookEventType

webhook_data = WebhookCreateRequest(
    url="https://myapp.com/webhooks/processing",
    events=[
        WebhookEventType.PROCESSING_STARTED,
        WebhookEventType.PROCESSING_COMPLETED,
        WebhookEventType.PROCESSING_FAILED
    ],
    description="Processing status updates"
)

webhook = await client.create_webhook(webhook_data)
print(f"Webhook created: {webhook.id}")
```

### List Webhooks

```python
webhooks = await client.list_webhooks()
for webhook in webhooks.data['webhooks']:
    print(f"Webhook {webhook['id']}: {webhook['url']}")
    print(f"Events: {webhook['events']}")
```

### Delete Webhook

```python
await client.delete_webhook(webhook_id)
print("Webhook deleted")
```

### Webhook Verification

```python
# Verify webhook signature
def handle_webhook(request_body: str, signature: str, secret: str):
    try:
        payload = client.parse_webhook_payload(request_body, signature, secret)
        print(f"Webhook event: {payload.event}")
        print(f"Data: {payload.data}")
    except IVIngestionError as e:
        print(f"Invalid webhook: {e}")
```

## Admin Functions

### Get Metrics

```python
# Get admin metrics (requires admin privileges)
metrics = await client.get_admin_metrics()

print(f"Files processed today: {metrics.files_processed['today']}")
print(f"Queue depth: {metrics.queue_depth['processing']}")
print(f"Error rate: {metrics.error_rate['overall']}%")
```

### Get Queue Status

```python
# Get queue status (requires admin privileges)
queues = await client.get_queue_status()

for queue in queues.data:
    print(f"Queue: {queue.name}")
    print(f"  Waiting: {queue.waiting}")
    print(f"  Active: {queue.active}")
    print(f"  Completed: {queue.completed}")
    print(f"  Failed: {queue.failed}")
```

## Rate Limiting

The SDK automatically handles rate limiting and provides access to rate limit information:

```python
# Get current rate limit info
rate_limit = client.get_rate_limit_info()
if rate_limit:
    print(f"Requests remaining: {rate_limit.remaining}")
    print(f"Reset time: {rate_limit.reset}")
```

## Error Handling

The SDK provides comprehensive error handling:

```python
from iv_ingestion import IVIngestionError

try:
    result = await client.upload_file("nonexistent.pdf")
except IVIngestionError as e:
    print(f"Error: {e.message}")
    print(f"Code: {e.code}")
    print(f"Status: {e.status}")
    print(f"Details: {e.details}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## TypeScript Support

The SDK includes full type hints and Pydantic models for type safety:

```python
from typing import List
from iv_ingestion import (
    IVIngestionClient,
    FileUploadResponse,
    ProcessingProgress,
    WebhookEventType
)

async def process_files(client: IVIngestionClient) -> List[FileUploadResponse]:
    results = []
    
    async for progress in client.monitor_processing("file_id"):
        # Type-safe access to progress properties
        if progress.status == "completed":
            break
    
    return results
```

## Examples

### Complete File Processing Workflow

```python
import asyncio
from iv_ingestion import IVIngestionClient, IVIngestionConfig

async def process_inspection_file(file_path: str, property_id: str):
    config = IVIngestionConfig(
        base_url="https://api.iv-ingestion.com/v1",
        api_key="your-api-key"
    )
    
    async with IVIngestionClient(config) as client:
        # Upload file
        print("Uploading file...")
        result = await client.upload_file(
            file_path=file_path,
            metadata={"property_id": property_id}
        )
        
        file_id = result.data['file_id']
        print(f"File uploaded: {file_id}")
        
        # Monitor processing
        print("Monitoring processing...")
        async for progress in client.monitor_processing(file_id):
            print(f"Progress: {progress.progress}% - {progress.current_step}")
            
            if progress.status == "completed":
                print("Processing completed!")
                break
            elif progress.status == "failed":
                print("Processing failed!")
                return None
        
        # Get inspection details
        print("Getting inspection details...")
        inspection = await client.get_inspection(file_id)
        
        print(f"Inspection completed for property {inspection.property.address}")
        print(f"Total findings: {len(inspection.findings)}")
        
        return inspection

# Run the workflow
async def main():
    inspection = await process_inspection_file(
        "inspection.pdf",
        "property_123"
    )
    
    if inspection:
        print("Inspection processed successfully!")
    else:
        print("Inspection processing failed!")

if __name__ == "__main__":
    asyncio.run(main())
```

### Webhook Integration

```python
from fastapi import FastAPI, Request, HTTPException
from iv_ingestion import IVIngestionClient, IVIngestionConfig

app = FastAPI()
client = IVIngestionClient(IVIngestionConfig(api_key="your-api-key"))

@app.post("/webhooks/processing")
async def handle_webhook(request: Request):
    # Get webhook payload
    body = await request.body()
    signature = request.headers.get("X-IV-Signature")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    try:
        # Verify and parse webhook
        payload = client.parse_webhook_payload(
            body.decode(),
            signature,
            "your-webhook-secret"
        )
        
        # Handle different event types
        if payload.event == "processing.completed":
            print(f"File {payload.data['file_id']} processing completed")
            # Process the completed file
            inspection = await client.get_inspection(payload.data['file_id'])
            # Send notifications, update database, etc.
            
        elif payload.event == "processing.failed":
            print(f"File {payload.data['file_id']} processing failed")
            # Handle processing failure
            # Send alerts, retry, etc.
            
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check your network connection and API base URL
2. **Authentication Errors**: Verify your API key or JWT token
3. **Rate Limit Errors**: The SDK automatically handles rate limiting, but you can check limits with `get_rate_limit_info()`
4. **File Upload Errors**: Ensure the file exists and is accessible

### Debug Mode

Enable debug mode to see detailed request/response information:

```python
config = IVIngestionConfig(
    debug=True,
    api_key="your-api-key"
)
```

### Logging

The SDK uses Python's logging module. Configure logging for more detailed output:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
```

## Support

- **Documentation**: [https://docs.iv-ingestion.com](https://docs.iv-ingestion.com)
- **API Reference**: [https://docs.iv-ingestion.com/api](https://docs.iv-ingestion.com/api)
- **GitHub**: [https://github.com/iv-ingestion/python-sdk](https://github.com/iv-ingestion/python-sdk)
- **Email**: support@iv-ingestion.com

## License

MIT License - see [LICENSE](LICENSE) file for details. 