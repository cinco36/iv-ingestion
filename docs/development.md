# Development Guide

This guide provides information for developers who want to contribute to the IV Ingestion project.

## Development Environment Setup

### Prerequisites

- Python 3.8 or higher
- Git
- Docker (optional, for containerized development)
- PostgreSQL (for database development)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/iv-ingestion.git
   cd iv-ingestion
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install development dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # If available
   ```

4. **Install pre-commit hooks**:
   ```bash
   pip install pre-commit
   pre-commit install
   ```

5. **Set up configuration**:
   ```bash
   cp config/config.example.yaml config/config.yaml
   # Edit config.yaml for your development environment
   ```

6. **Set up database** (optional):
   ```bash
   # Create test database
   createdb iv_ingestion_test
   
   # Run migrations (if applicable)
   python -m alembic upgrade head
   ```

## Project Structure

```
iv-ingestion/
├── src/                    # Source code
│   ├── main.py            # Application entry point
│   ├── ingestion/         # Ingestion modules
│   │   ├── __init__.py
│   │   ├── ingestion_manager.py
│   │   ├── sources/       # Data source implementations
│   │   └── validators/    # Data validation
│   ├── processing/        # Data processing modules
│   │   ├── __init__.py
│   │   ├── transformers/  # Data transformation
│   │   └── aggregators/   # Data aggregation
│   ├── storage/           # Storage implementations
│   │   ├── __init__.py
│   │   ├── database.py
│   │   └── file_system.py
│   ├── api/               # API layer
│   │   ├── __init__.py
│   │   ├── routes/        # API routes
│   │   └── middleware/    # API middleware
│   └── utils/             # Utility functions
│       ├── __init__.py
│       ├── config.py
│       └── helpers.py
├── tests/                 # Test files
│   ├── __init__.py
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── fixtures/          # Test fixtures
├── config/                # Configuration files
├── docs/                  # Documentation
├── scripts/               # Development scripts
└── requirements.txt       # Dependencies
```

## Coding Standards

### Python Style Guide

We follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) with some modifications:

- **Line length**: 88 characters (Black formatter default)
- **Import order**: Standard library, third-party, local imports
- **Docstrings**: Google style docstrings
- **Type hints**: Required for all function parameters and return values

### Code Formatting

We use [Black](https://black.readthedocs.io/) for code formatting:

```bash
# Format all Python files
black src/ tests/

# Check formatting without making changes
black --check src/ tests/
```

### Linting

We use [flake8](https://flake8.pycqa.org/) for linting:

```bash
# Run linter
flake8 src/ tests/

# Configuration in setup.cfg or pyproject.toml
```

### Type Checking

We use [mypy](http://mypy-lang.org/) for static type checking:

```bash
# Run type checker
mypy src/

# Configuration in mypy.ini or pyproject.toml
```

### Example Code Style

```python
"""Module for handling data ingestion operations."""

from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from src.utils.config import load_config


class DataIngester:
    """Handles data ingestion from various sources.
    
    This class provides methods for ingesting data from different
    sources and processing them according to configured rules.
    
    Attributes:
        config: Configuration dictionary containing ingestion settings
        logger: Logger instance for this class
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        """Initialize the DataIngester.
        
        Args:
            config: Configuration dictionary. If None, loads from default config.
            
        Raises:
            ValueError: If configuration is invalid.
        """
        self.config = config or load_config()
        self.logger = logging.getLogger(__name__)
        
        if not self._validate_config():
            raise ValueError("Invalid configuration provided")
    
    def ingest_data(self, source_id: str) -> Dict[str, Any]:
        """Ingest data from a specific source.
        
        Args:
            source_id: Identifier for the data source.
            
        Returns:
            Dictionary containing ingestion results.
            
        Raises:
            SourceNotFoundError: If the source doesn't exist.
            IngestionError: If ingestion fails.
        """
        # Implementation here
        pass
```

## Testing

### Test Structure

We use [pytest](https://pytest.org/) for testing:

```
tests/
├── unit/                  # Unit tests
│   ├── test_ingestion_manager.py
│   ├── test_config.py
│   └── test_validators.py
├── integration/           # Integration tests
│   ├── test_api.py
│   ├── test_database.py
│   └── test_end_to_end.py
├── fixtures/              # Test fixtures
│   ├── sample_data.csv
│   └── test_config.yaml
└── conftest.py           # Pytest configuration
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_ingestion_manager.py

# Run tests matching pattern
pytest -k "test_ingestion"

# Run with verbose output
pytest -v

# Run integration tests only
pytest tests/integration/

# Run with parallel execution
pytest -n auto
```

### Writing Tests

```python
"""Tests for the DataIngester class."""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime

from src.ingestion.data_ingester import DataIngester
from src.exceptions import SourceNotFoundError, IngestionError


class TestDataIngester:
    """Test cases for DataIngester class."""
    
    @pytest.fixture
    def ingester(self):
        """Create a DataIngester instance for testing."""
        config = {
            'ingestion_interval': 60,
            'data_sources': [
                {'id': 'test_source', 'type': 'file', 'path': '/test/path'}
            ]
        }
        return DataIngester(config)
    
    def test_initialization(self, ingester):
        """Test that DataIngester initializes correctly."""
        assert ingester.config['ingestion_interval'] == 60
        assert len(ingester.config['data_sources']) == 1
    
    def test_ingest_data_success(self, ingester):
        """Test successful data ingestion."""
        with patch.object(ingester, '_read_source') as mock_read:
            mock_read.return_value = [{'id': 1, 'value': 100}]
            
            result = ingester.ingest_data('test_source')
            
            assert result['success'] is True
            assert result['records_processed'] == 1
            mock_read.assert_called_once_with('test_source')
    
    def test_ingest_data_source_not_found(self, ingester):
        """Test ingestion with non-existent source."""
        with pytest.raises(SourceNotFoundError):
            ingester.ingest_data('non_existent_source')
    
    @pytest.mark.integration
    def test_end_to_end_ingestion(self, ingester, sample_data_file):
        """Integration test for complete ingestion process."""
        # This test would use real files and database
        result = ingester.ingest_data('test_source')
        assert result['success'] is True
```

### Test Fixtures

```python
# conftest.py
import pytest
import tempfile
import os
from pathlib import Path


@pytest.fixture
def sample_data_file():
    """Create a temporary sample data file."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        f.write("id,timestamp,value\n")
        f.write("1,2024-01-01T00:00:00Z,100.0\n")
        f.write("2,2024-01-01T01:00:00Z,200.0\n")
        temp_file = f.name
    
    yield temp_file
    
    # Cleanup
    os.unlink(temp_file)


@pytest.fixture
def test_config():
    """Provide test configuration."""
    return {
        'ingestion_interval': 30,
        'log_level': 'DEBUG',
        'data_sources': [
            {
                'id': 'test_source',
                'type': 'file',
                'path': '/tmp/test_data.csv',
                'format': 'csv'
            }
        ]
    }
```

## Git Workflow

### Branch Naming Convention

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/urgent-fix` - Critical fixes
- `docs/documentation-update` - Documentation updates
- `refactor/component-name` - Code refactoring

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Examples:
```
feat(ingestion): add support for JSON data sources

fix(api): resolve authentication token validation issue

docs(readme): update installation instructions

refactor(processing): simplify data transformation logic
```

### Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make your changes**:
   ```bash
   # Make code changes
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Run tests and checks**:
   ```bash
   pytest
   black --check src/ tests/
   flake8 src/ tests/
   mypy src/
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/new-feature
   # Create PR on GitHub
   ```

5. **Code review process**:
   - At least one approval required
   - All CI checks must pass
   - Address review comments

6. **Merge**:
   - Squash and merge (preferred)
   - Delete feature branch after merge

## Development Tools

### Pre-commit Hooks

We use pre-commit hooks to ensure code quality:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 22.3.0
    hooks:
      - id: black
        language_version: python3
  
  - repo: https://github.com/pycqa/flake8
    rev: 4.0.1
    hooks:
      - id: flake8
  
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v0.950
    hooks:
      - id: mypy
        additional_dependencies: [types-requests]
  
  - repo: https://github.com/pycqa/isort
    rev: 5.10.1
    hooks:
      - id: isort
```

### IDE Configuration

#### VS Code Settings

```json
{
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.linting.mypyEnabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

#### PyCharm Configuration

- Set project interpreter to virtual environment
- Enable Black formatter
- Configure flake8 and mypy external tools
- Enable auto-import organization

## Debugging

### Logging

Use structured logging for debugging:

```python
import logging
from loguru import logger

# Configure logging
logger.add("logs/debug.log", level="DEBUG", rotation="1 day")

# Use in code
logger.debug("Processing record", extra={"record_id": 123, "source": "api"})
logger.info("Ingestion completed", extra={"records_processed": 1000})
logger.error("Failed to connect", extra={"source": "database", "error": str(e)})
```

### Debug Mode

Enable debug mode for development:

```bash
export IV_LOG_LEVEL=DEBUG
export IV_API_DEBUG=true
python src/main.py
```

### Database Debugging

```python
# Enable SQL logging
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Use database debugging tools
from src.storage.database import get_db_session
with get_db_session() as session:
    # Your database operations
    pass
```

## Performance Optimization

### Profiling

Use cProfile for performance analysis:

```bash
python -m cProfile -o profile.stats src/main.py
python -c "import pstats; p = pstats.Stats('profile.stats'); p.sort_stats('cumulative').print_stats(20)"
```

### Memory Profiling

```bash
pip install memory-profiler
python -m memory_profiler src/main.py
```

## Documentation

### Code Documentation

- Use Google style docstrings
- Include type hints
- Document exceptions and edge cases
- Provide usage examples

### API Documentation

- Use OpenAPI/Swagger for API documentation
- Include request/response examples
- Document error codes and messages

### Architecture Documentation

- Document system architecture
- Include sequence diagrams
- Document data flow
- Maintain deployment guides

## Security

### Code Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate all input data
- Use parameterized queries for database operations
- Implement proper authentication and authorization

### Security Testing

```bash
# Run security checks
bandit -r src/
safety check
```

## Deployment

### Local Development

```bash
# Run in development mode
python src/main.py

# Run with hot reload (if using uvicorn)
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Development

```dockerfile
# Dockerfile.dev
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["python", "src/main.py"]
```

```bash
# Build and run
docker build -f Dockerfile.dev -t iv-ingestion:dev .
docker run -p 8000:8000 iv-ingestion:dev
```

## Getting Help

### Resources

- [Project Issues](https://github.com/yourusername/iv-ingestion/issues)
- [Project Wiki](https://github.com/yourusername/iv-ingestion/wiki)
- [Discussion Forum](https://github.com/yourusername/iv-ingestion/discussions)

### Contact

- Create an issue for bugs or feature requests
- Use discussions for questions and ideas
- Contact maintainers for urgent issues

## Next Steps

- Review the [Configuration Guide](configuration.md) for setup details
- Check the [API Reference](api.md) for available endpoints
- See the [Troubleshooting Guide](troubleshooting.md) for common issues 