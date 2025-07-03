"""
IV Ingestion Python SDK

Official Python SDK for the IV Ingestion API - Home inspection data processing and management.

Example:
    ```python
    from iv_ingestion import IVIngestionClient
    
    # Initialize client
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
"""

__version__ = "1.0.0"
__author__ = "IV Ingestion Team"
__email__ = "support@iv-ingestion.com"

from .client import IVIngestionClient, IVIngestionConfig
from .models import (
    User,
    FileUploadResponse,
    FileStatus,
    Finding,
    Inspection,
    InspectionDetail,
    Webhook,
    HealthStatusResponse,
    UploadProgress,
    ProcessingProgress,
    IVIngestionError,
)

__all__ = [
    "IVIngestionClient",
    "IVIngestionConfig",
    "User",
    "FileUploadResponse",
    "FileStatus",
    "Finding",
    "Inspection",
    "InspectionDetail",
    "Webhook",
    "HealthStatus",
    "UploadProgress",
    "ProcessingProgress",
    "IVIngestionError",
] 