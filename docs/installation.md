# Installation Guide

This guide will walk you through installing and setting up the IV Ingestion project.

## Prerequisites

Before installing the IV Ingestion project, ensure you have the following:

- **Python 3.8 or higher**
- **Git**
- **pip** (Python package installer)
- **Virtual environment tool** (recommended: `venv` or `conda`)

### Checking Your Python Version

```bash
python --version
# or
python3 --version
```

If you don't have Python installed, download it from [python.org](https://python.org).

## Installation Methods

### Method 1: Clone and Install (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/iv-ingestion.git
   cd iv-ingestion
   ```

2. **Create a virtual environment**:
   ```bash
   # Using venv (Python 3.3+)
   python -m venv venv
   
   # Activate the virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify installation**:
   ```bash
   python -c "import src; print('Installation successful!')"
   ```

### Method 2: Using pip (Development)

```bash
pip install git+https://github.com/yourusername/iv-ingestion.git
```

## Configuration Setup

1. **Copy the example configuration**:
   ```bash
   cp config/config.example.yaml config/config.yaml
   ```

2. **Edit the configuration file**:
   ```bash
   # Open in your preferred editor
   nano config/config.yaml
   # or
   code config/config.yaml
   ```

3. **Set environment variables** (optional):
   ```bash
   export IV_DB_PASSWORD="your_database_password"
   export IV_LOG_LEVEL="DEBUG"
   ```

## Database Setup (Optional)

If you plan to use a database:

1. **Install PostgreSQL** (recommended):
   ```bash
   # On macOS with Homebrew:
   brew install postgresql
   brew services start postgresql
   
   # On Ubuntu/Debian:
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create the database**:
   ```bash
   createdb iv_ingestion
   ```

3. **Update configuration**:
   Edit `config/config.yaml` with your database credentials.

## Development Setup

For developers who want to contribute:

1. **Install development dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install pytest pytest-cov black flake8 mypy
   ```

2. **Set up pre-commit hooks** (optional):
   ```bash
   pip install pre-commit
   pre-commit install
   ```

3. **Run tests**:
   ```bash
   pytest tests/
   ```

## Verification

After installation, verify everything is working:

1. **Test the configuration loading**:
   ```bash
   python -c "from src.utils.config import load_config; print(load_config())"
   ```

2. **Run a quick test**:
   ```bash
   python -m pytest tests/test_ingestion_manager.py -v
   ```

3. **Start the application** (for a few seconds):
   ```bash
   timeout 5 python src/main.py || echo "Application started successfully"
   ```

## Troubleshooting

### Common Issues

**ImportError: No module named 'src'**
- Make sure you're in the project root directory
- Ensure the virtual environment is activated
- Check that all dependencies are installed

**Permission denied errors**
- Use `sudo` for system-wide installations
- Or use virtual environments (recommended)

**Database connection errors**
- Verify PostgreSQL is running
- Check database credentials in config
- Ensure the database exists

### Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](troubleshooting.md)
2. Search existing [GitHub Issues](https://github.com/yourusername/iv-ingestion/issues)
3. Create a new issue with:
   - Your operating system
   - Python version
   - Error message
   - Steps to reproduce

## Next Steps

After successful installation:

1. Read the [Configuration Guide](configuration.md)
2. Review the [API Reference](api.md)
3. Check out the [Development Guide](development.md) if you plan to contribute 