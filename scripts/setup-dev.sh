#!/bin/bash

echo "🚀 Setting up IV Ingestion API for development..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    echo "🐳 Docker is running"
    echo "📦 Starting database with Docker..."
    docker-compose up -d db
    
    echo "⏳ Waiting for database to be ready..."
    sleep 5
    
    echo "🗄️ Running database migrations..."
    npm run migrate
    
    echo "🌱 Seeding database..."
    npm run seed
    
    echo "✅ Database setup complete!"
else
    echo "⚠️ Docker is not running"
    echo "💡 Please start Docker Desktop or install PostgreSQL locally"
    echo "💡 For local PostgreSQL: brew install postgresql && brew services start postgresql"
fi

echo ""
echo "🎉 Development setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the server: npm run dev"
echo "2. Test the API: curl http://localhost:3000/health"
echo "3. View docs: http://localhost:3000/api-docs"
echo ""
echo "🔗 Useful URLs:"
echo "- Health Check: http://localhost:3000/health"
echo "- API Documentation: http://localhost:3000/api-docs"
echo "- API Base: http://localhost:3000/api/v1" 