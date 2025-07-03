# Troubleshooting Guide

This guide helps you resolve common issues and errors when using the IV Ingestion project.

## Quick Diagnosis

### Check System Status

```bash
# Check if the service is running
curl http://localhost:8000/api/v1/health

# Check service status
curl http://localhost:8000/api/v1/status

# Check logs
tail -f logs/iv_ingestion.log
```

### Common Health Check Issues

| Issue | Symptoms | Quick Fix |
|-------|----------|-----------|
| Service not responding | Connection refused | Check if service is running |
| Database connection failed | 500 error | Verify database is running |
| Configuration error | 500 error | Check config file syntax |
| Memory issues | Slow response | Check system resources |

## Installation Issues

### Python Version Problems

**Error**: `SyntaxError: invalid syntax` or `ModuleNotFoundError`

**Solution**:
```bash
# Check Python version
python --version

# Ensure Python 3.8+ is installed
# On macOS:
brew install python@3.9

# On Ubuntu:
sudo apt update
sudo apt install python3.9 python3.9-venv
```

### Virtual Environment Issues

**Error**: `ModuleNotFoundError: No module named 'src'`

**Solution**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt

# Check if you're in the correct directory
pwd  # Should show /path/to/iv-ingestion
```

### Dependency Installation Issues

**Error**: `pip install` fails with compilation errors

**Solution**:
```bash
# Install system dependencies first
# On Ubuntu/Debian:
sudo apt-get install python3-dev build-essential

# On macOS:
xcode-select --install

# Try installing with specific Python version
python3.9 -m pip install -r requirements.txt
```

## Configuration Issues

### Configuration File Not Found

**Error**: `FileNotFoundError: config/config.yaml`

**Solution**:
```bash
# Copy example configuration
cp config/config.example.yaml config/config.yaml

# Edit configuration
nano config/config.yaml
```

### Invalid YAML Syntax

**Error**: `yaml.YAMLError: mapping values are not allowed here`

**Solution**:
```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('config/config.yaml'))"

# Common YAML issues:
# - Missing quotes around strings with special characters
# - Incorrect indentation (use spaces, not tabs)
# - Missing colons after keys
```

### Environment Variables Not Working

**Error**: Configuration values not being overridden

**Solution**:
```bash
# Check if environment variables are set
echo $IV_DB_PASSWORD
echo $IV_LOG_LEVEL

# Set environment variables
export IV_DB_PASSWORD="your_password"
export IV_LOG_LEVEL="DEBUG"

# Restart the application after setting variables
```

## Database Issues

### Connection Refused

**Error**: `psycopg2.OperationalError: could not connect to server`

**Solution**:
```bash
# Check if PostgreSQL is running
# On macOS:
brew services list | grep postgresql

# On Ubuntu:
sudo systemctl status postgresql

# Start PostgreSQL if not running
# On macOS:
brew services start postgresql

# On Ubuntu:
sudo systemctl start postgresql
```

### Authentication Failed

**Error**: `psycopg2.OperationalError: FATAL: password authentication failed`

**Solution**:
```bash
# Check database credentials
psql -h localhost -U postgres -d iv_ingestion

# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new_password';
\q

# Update configuration
echo "export IV_DB_PASSWORD='new_password'" >> ~/.bashrc
source ~/.bashrc
```

### Database Does Not Exist

**Error**: `psycopg2.OperationalError: database "iv_ingestion" does not exist`

**Solution**:
```bash
# Create database
createdb iv_ingestion

# Or using psql
psql -h localhost -U postgres
CREATE DATABASE iv_ingestion;
\q
```

## Ingestion Issues

### Data Source Not Found

**Error**: `SourceNotFoundError: Data source 'source_1' not found`

**Solution**:
```bash
# Check configured data sources
python -c "from src.utils.config import load_config; print(load_config()['data_sources'])"

# Add missing data source to config
# Edit config/config.yaml and add:
data_sources:
  - name: "source_1"
    type: "file"
    path: "/path/to/data.csv"
    format: "csv"
    enabled: true
```

### File Permission Issues

**Error**: `PermissionError: [Errno 13] Permission denied`

**Solution**:
```bash
# Check file permissions
ls -la /path/to/data.csv

# Fix permissions
chmod 644 /path/to/data.csv

# Check directory permissions
ls -la /path/to/data/

# Fix directory permissions
chmod 755 /path/to/data/
```

### API Connection Issues

**Error**: `requests.exceptions.ConnectionError: Failed to establish a new connection`

**Solution**:
```bash
# Test API endpoint manually
curl -v https://api.example.com/data

# Check network connectivity
ping api.example.com

# Verify API credentials
# Check if API key/token is valid
curl -H "Authorization: Bearer your-token" https://api.example.com/data
```

### Data Validation Errors

**Error**: `ValidationError: Required column 'timestamp' not found`

**Solution**:
```bash
# Check data file structure
head -5 /path/to/data.csv

# Update validation rules in config
validation:
  required_columns: ["id", "value"]  # Remove 'timestamp' if not present
  data_types:
    id: "string"
    value: "float"
```

## Performance Issues

### Slow Ingestion

**Symptoms**: Ingestion taking much longer than expected

**Diagnosis**:
```bash
# Check system resources
top
htop
df -h

# Check database performance
psql -h localhost -U postgres -d iv_ingestion -c "SELECT * FROM pg_stat_activity;"
```

**Solutions**:
```yaml
# Optimize configuration
processing:
  batch_size: 5000  # Increase batch size
  max_workers: 8    # Increase workers
  timeout: 600      # Increase timeout

# Add database indexes
CREATE INDEX idx_timestamp ON data_table(timestamp);
CREATE INDEX idx_source ON data_table(source);
```

### High Memory Usage

**Symptoms**: Application using excessive memory

**Diagnosis**:
```bash
# Monitor memory usage
ps aux | grep python
free -h

# Check for memory leaks
python -m memory_profiler src/main.py
```

**Solutions**:
```python
# Optimize data processing
# Use generators instead of lists
def process_data_generator(data_source):
    for chunk in data_source:
        yield process_chunk(chunk)

# Reduce batch size
batch_size = 1000  # Instead of 10000
```

### Database Connection Pool Exhausted

**Error**: `QueuePool limit of size X overflow Y reached`

**Solution**:
```yaml
# Increase connection pool size
database:
  pool_size: 20
  max_overflow: 30
  pool_timeout: 30
  pool_recycle: 3600
```

## API Issues

### Authentication Errors

**Error**: `401 Unauthorized` or `403 Forbidden`

**Solution**:
```bash
# Check API key
curl -H "X-API-Key: your-api-key" http://localhost:8000/api/v1/health

# Generate new API key if needed
# Check API key configuration in config
```

### Rate Limiting

**Error**: `429 Too Many Requests`

**Solution**:
```bash
# Check rate limit headers
curl -I http://localhost:8000/api/v1/data/query

# Implement exponential backoff
import time
import random

def api_call_with_retry():
    for attempt in range(3):
        try:
            return make_api_call()
        except RateLimitError:
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait_time)
```

### CORS Issues

**Error**: CORS policy blocking requests from frontend

**Solution**:
```yaml
# Update CORS configuration
api:
  cors_origins: 
    - "http://localhost:3000"
    - "https://your-frontend-domain.com"
  cors_methods: ["GET", "POST", "PUT", "DELETE"]
  cors_headers: ["*"]
```

## Logging Issues

### No Logs Generated

**Symptoms**: Application running but no log files created

**Solution**:
```bash
# Check log directory permissions
ls -la logs/

# Create log directory if missing
mkdir -p logs
chmod 755 logs

# Check logging configuration
python -c "from src.utils.config import load_config; print(load_config().get('logging', {}))"
```

### Excessive Log Volume

**Symptoms**: Log files growing too large too quickly

**Solution**:
```python
# Configure log rotation
from loguru import logger

logger.add(
    "logs/iv_ingestion.log",
    rotation="100 MB",      # Rotate at 100MB
    retention="30 days",    # Keep logs for 30 days
    compression="zip",      # Compress old logs
    level="INFO"           # Reduce log level
)
```

## Network Issues

### Firewall Blocking Connections

**Error**: `Connection refused` or `Timeout`

**Solution**:
```bash
# Check firewall rules
sudo ufw status

# Allow application port
sudo ufw allow 8000

# Check if port is in use
netstat -tulpn | grep 8000
lsof -i :8000
```

### DNS Resolution Issues

**Error**: `Name or service not known`

**Solution**:
```bash
# Test DNS resolution
nslookup api.example.com

# Check /etc/hosts file
cat /etc/hosts

# Use IP address instead of hostname in config
```

## Security Issues

### SSL Certificate Errors

**Error**: `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution**:
```python
# For development, disable SSL verification (not recommended for production)
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

# Or update certificates
# On macOS:
/Applications/Python\ 3.9/Install\ Certificates.command

# On Ubuntu:
sudo apt-get install ca-certificates
sudo update-ca-certificates
```

### API Key Exposure

**Issue**: API keys committed to version control

**Solution**:
```bash
# Remove sensitive data from git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch config/config.yaml' \
  --prune-empty --tag-name-filter cat -- --all

# Add to .gitignore
echo "config/config.yaml" >> .gitignore
echo "*.key" >> .gitignore
echo "*.pem" >> .gitignore

# Use environment variables instead
export IV_API_KEY="your-api-key"
```

## Monitoring and Debugging

### Enable Debug Mode

```bash
# Set debug environment variables
export IV_LOG_LEVEL=DEBUG
export IV_API_DEBUG=true
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Run with debug output
python -u src/main.py
```

### Profiling Performance

```bash
# Profile CPU usage
python -m cProfile -o profile.stats src/main.py
python -c "import pstats; p = pstats.Stats('profile.stats'); p.sort_stats('cumulative').print_stats(20)"

# Profile memory usage
pip install memory-profiler
python -m memory_profiler src/main.py
```

### Database Query Analysis

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Analyze slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Getting Help

### Collecting Debug Information

```bash
# Create debug report
cat > debug_report.txt << EOF
=== System Information ===
$(uname -a)
$(python --version)
$(pip list)

=== Configuration ===
$(cat config/config.yaml)

=== Logs ===
$(tail -50 logs/iv_ingestion.log)

=== Environment Variables ===
$(env | grep IV_)

=== Database Status ===
$(psql -h localhost -U postgres -d iv_ingestion -c "SELECT version();")
EOF
```

### Reporting Issues

When reporting issues, include:

1. **Error message**: Exact error text
2. **Steps to reproduce**: Detailed steps
3. **Environment**: OS, Python version, dependencies
4. **Configuration**: Relevant config sections (remove secrets)
5. **Logs**: Relevant log entries
6. **Debug report**: Output from debug script above

### Useful Commands

```bash
# Quick health check
curl -s http://localhost:8000/api/v1/health | jq .

# Check all endpoints
for endpoint in health status config; do
  echo "Testing $endpoint..."
  curl -s "http://localhost:8000/api/v1/$endpoint" | jq .
done

# Monitor logs in real-time
tail -f logs/iv_ingestion.log | grep -E "(ERROR|WARNING|CRITICAL)"

# Check disk space
df -h
du -sh logs/ data/

# Check memory usage
free -h
ps aux | grep python
```

## Next Steps

- Review the [Installation Guide](installation.md) for setup instructions
- Check the [Configuration Guide](configuration.md) for configuration details
- See the [API Reference](api.md) for endpoint documentation
- Read the [Development Guide](development.md) for contribution guidelines 