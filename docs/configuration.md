# Configuration Guide

This guide explains how to configure the IV Ingestion project to meet your specific needs.

## Configuration Overview

The IV Ingestion project uses a hierarchical configuration system:

1. **Default values** (built into the code)
2. **Configuration file** (`config/config.yaml`)
3. **Environment variables** (override file settings)

## Configuration File Structure

The main configuration file is `config/config.yaml`. Here's the complete structure:

```yaml
# Ingestion settings
ingestion_interval: 60  # seconds between ingestion cycles
log_level: INFO  # DEBUG, INFO, WARNING, ERROR

# Data sources configuration
data_sources:
  - name: "source_1"
    type: "file"
    path: "/path/to/data/source1"
    format: "csv"
    enabled: true
    validation:
      required_columns: ["id", "timestamp", "value"]
      data_types:
        id: "string"
        timestamp: "datetime"
        value: "float"
  - name: "source_2"
    type: "api"
    url: "https://api.example.com/data"
    method: "GET"
    headers:
      Authorization: "Bearer your-token-here"
      Content-Type: "application/json"
    enabled: false
    rate_limit: 100  # requests per minute

# Database configuration
database:
  host: "localhost"
  port: 5432
  name: "iv_ingestion"
  user: "postgres"
  password: ""  # Set via environment variable IV_DB_PASSWORD
  pool_size: 10
  max_overflow: 20
  ssl_mode: "prefer"

# API configuration (if running as a service)
api:
  host: "0.0.0.0"
  port: 8000
  debug: false
  cors_origins: ["http://localhost:3000"]
  rate_limit: 1000  # requests per minute

# Processing settings
processing:
  batch_size: 1000
  max_workers: 4
  timeout: 300  # seconds
  retry_attempts: 3
  retry_delay: 5  # seconds

# Storage settings
storage:
  type: "local"  # local, s3, gcs
  path: "./data"
  retention_days: 30
  compression: true
  encryption: false

# Monitoring and alerting
monitoring:
  enabled: true
  metrics_port: 9090
  health_check_interval: 30
  alerting:
    email:
      enabled: false
      smtp_server: "smtp.gmail.com"
      smtp_port: 587
      username: ""
      password: ""
    webhook:
      enabled: false
      url: ""
```

## Environment Variables

You can override any configuration setting using environment variables:

| Environment Variable | Configuration Path | Type | Description |
|---------------------|-------------------|------|-------------|
| `IV_INGESTION_INTERVAL` | `ingestion_interval` | int | Seconds between ingestion cycles |
| `IV_LOG_LEVEL` | `log_level` | string | Logging level |
| `IV_DB_HOST` | `database.host` | string | Database host |
| `IV_DB_PORT` | `database.port` | int | Database port |
| `IV_DB_NAME` | `database.name` | string | Database name |
| `IV_DB_USER` | `database.user` | string | Database user |
| `IV_DB_PASSWORD` | `database.password` | string | Database password |
| `IV_API_HOST` | `api.host` | string | API host |
| `IV_API_PORT` | `api.port` | int | API port |
| `IV_API_DEBUG` | `api.debug` | bool | API debug mode |

### Setting Environment Variables

**Linux/macOS:**
```bash
export IV_DB_PASSWORD="your_secure_password"
export IV_LOG_LEVEL="DEBUG"
```

**Windows:**
```cmd
set IV_DB_PASSWORD=your_secure_password
set IV_LOG_LEVEL=DEBUG
```

**Using a .env file:**
```bash
# Create .env file
echo "IV_DB_PASSWORD=your_secure_password" > .env
echo "IV_LOG_LEVEL=DEBUG" >> .env

# Load in your shell
source .env
```

## Data Source Configuration

### File-based Sources

```yaml
data_sources:
  - name: "csv_source"
    type: "file"
    path: "/path/to/data.csv"
    format: "csv"
    enabled: true
    options:
      delimiter: ","
      encoding: "utf-8"
      skip_rows: 1
    validation:
      required_columns: ["id", "timestamp", "value"]
      data_types:
        id: "string"
        timestamp: "datetime"
        value: "float"
```

### API-based Sources

```yaml
data_sources:
  - name: "api_source"
    type: "api"
    url: "https://api.example.com/data"
    method: "GET"
    headers:
      Authorization: "Bearer your-token"
      Content-Type: "application/json"
    enabled: true
    rate_limit: 100
    timeout: 30
    retry_attempts: 3
```

### Database Sources

```yaml
data_sources:
  - name: "db_source"
    type: "database"
    connection:
      host: "localhost"
      port: 5432
      database: "source_db"
      user: "user"
      password: "password"
    query: "SELECT * FROM data_table WHERE updated_at > %(last_sync)s"
    enabled: true
```

## Database Configuration

### PostgreSQL

```yaml
database:
  type: "postgresql"
  host: "localhost"
  port: 5432
  name: "iv_ingestion"
  user: "postgres"
  password: ""
  pool_size: 10
  max_overflow: 20
  ssl_mode: "prefer"
```

### SQLite (Development)

```yaml
database:
  type: "sqlite"
  path: "./data/iv_ingestion.db"
```

## Storage Configuration

### Local Storage

```yaml
storage:
  type: "local"
  path: "./data"
  retention_days: 30
  compression: true
  encryption: false
```

### AWS S3

```yaml
storage:
  type: "s3"
  bucket: "iv-ingestion-data"
  region: "us-east-1"
  access_key: ""
  secret_key: ""
  retention_days: 90
  compression: true
  encryption: true
```

### Google Cloud Storage

```yaml
storage:
  type: "gcs"
  bucket: "iv-ingestion-data"
  project_id: "your-project-id"
  credentials_file: "/path/to/service-account.json"
  retention_days: 90
  compression: true
```

## Logging Configuration

### Log Levels

- `DEBUG`: Detailed information for debugging
- `INFO`: General information about program execution
- `WARNING`: Indicate a potential problem
- `ERROR`: A more serious problem
- `CRITICAL`: A critical problem that may prevent the program from running

### Log Format

```yaml
logging:
  level: "INFO"
  format: "{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
  file: "logs/iv_ingestion.log"
  rotation: "1 day"
  retention: "30 days"
```

## Security Configuration

### API Security

```yaml
api:
  security:
    enabled: true
    auth_type: "jwt"  # jwt, api_key, oauth2
    jwt_secret: ""
    api_key_header: "X-API-Key"
    cors_origins: ["http://localhost:3000"]
    rate_limit: 1000
```

### Data Encryption

```yaml
security:
  encryption:
    enabled: true
    algorithm: "AES-256-GCM"
    key_file: "/path/to/encryption.key"
  ssl:
    enabled: true
    cert_file: "/path/to/cert.pem"
    key_file: "/path/to/key.pem"
```

## Validation

The configuration system validates your settings:

```python
from src.utils.config import load_config, validate_config

# Load and validate configuration
config = load_config()
validate_config(config)
```

## Configuration Best Practices

1. **Use environment variables for secrets**: Never commit passwords or API keys to version control
2. **Use different configs for environments**: Create separate configs for dev, staging, and production
3. **Validate configuration**: Always validate your configuration before running
4. **Document custom settings**: Document any custom configuration in your team's documentation
5. **Use configuration templates**: Create templates for common deployment scenarios

## Troubleshooting Configuration

### Common Issues

**Configuration not loading:**
- Check file permissions
- Verify YAML syntax
- Ensure file path is correct

**Environment variables not working:**
- Check variable names (case-sensitive)
- Ensure variables are exported
- Restart the application after setting variables

**Database connection issues:**
- Verify database is running
- Check credentials
- Test connection manually

### Configuration Validation

Run configuration validation:

```bash
python -c "from src.utils.config import load_config; config = load_config(); print('Configuration valid')"
```

## Next Steps

- Review the [API Reference](api.md) for available endpoints
- Check the [Development Guide](development.md) for contribution guidelines
- See the [Troubleshooting Guide](troubleshooting.md) for common issues 