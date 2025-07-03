#!/usr/bin/env python3
"""
Setup script for IV Ingestion Python SDK
"""

from setuptools import setup, find_packages
import os

# Read the README file
def read_readme():
    readme_path = os.path.join(os.path.dirname(__file__), 'README.md')
    if os.path.exists(readme_path):
        with open(readme_path, 'r', encoding='utf-8') as f:
            return f.read()
    return ""

# Read version from __init__.py
def get_version():
    init_path = os.path.join(os.path.dirname(__file__), 'iv_ingestion', '__init__.py')
    with open(init_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('__version__'):
                return line.split('=')[1].strip().strip('"\'')
    return '1.0.0'

setup(
    name='iv-ingestion',
    version=get_version(),
    description='Official Python SDK for IV Ingestion API',
    long_description=read_readme(),
    long_description_content_type='text/markdown',
    author='IV Ingestion Team',
    author_email='support@iv-ingestion.com',
    url='https://github.com/iv-ingestion/sdk-python',
    project_urls={
        'Documentation': 'https://docs.iv-ingestion.com/sdk/python',
        'Bug Reports': 'https://github.com/iv-ingestion/sdk-python/issues',
        'Source': 'https://github.com/iv-ingestion/sdk-python',
    },
    packages=find_packages(),
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'Topic :: Software Development :: Libraries :: Python Modules',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
        'Topic :: Scientific/Engineering :: Artificial Intelligence',
    ],
    python_requires='>=3.8',
    install_requires=[
        'requests>=2.25.0',
        'aiohttp>=3.8.0',
        'websockets>=10.0',
        'pydantic>=2.0.0',
        'typing-extensions>=4.0.0',
    ],
    extras_require={
        'dev': [
            'pytest>=7.0.0',
            'pytest-asyncio>=0.21.0',
            'pytest-cov>=4.0.0',
            'black>=23.0.0',
            'isort>=5.12.0',
            'flake8>=6.0.0',
            'mypy>=1.0.0',
            'pre-commit>=3.0.0',
        ],
        'docs': [
            'sphinx>=6.0.0',
            'sphinx-rtd-theme>=1.2.0',
            'myst-parser>=1.0.0',
        ],
    },
    entry_points={
        'console_scripts': [
            'iv-ingestion=iv_ingestion.cli:main',
        ],
    },
    include_package_data=True,
    zip_safe=False,
    keywords=[
        'iv-ingestion',
        'api',
        'sdk',
        'python',
        'home-inspection',
        'file-processing',
        'async',
        'websockets',
    ],
    license='MIT',
    platforms=['any'],
) 