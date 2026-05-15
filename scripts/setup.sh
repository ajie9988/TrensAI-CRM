#!/bin/bash

# TrensAI CRM - Setup Script

set -e

echo "🚀 TrensAI CRM Setup"
echo "=================================="
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker is not installed. Please install Docker first."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is not installed. Please install Docker Compose first."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Git is not installed. Please install Git first."; exit 1; }

# Create environment file
echo "📝 Creating .env file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ .env created. Please edit it with your configuration."
else
    echo "✓ .env already exists"
fi

# Build images
echo ""
echo "🔨 Building Docker images..."
docker-compose build

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo ""
echo "📊 Running database migrations..."
docker-compose exec -T backend php artisan migrate:fresh --seed

# Display information
echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 Access the platform:"
echo "  Dashboard: http://localhost:3000"
echo "  API: http://localhost:8000/api"
echo ""
echo "👤 Default credentials:"
echo "  Email: admin@example.com"
echo "  Password: password123"
echo ""
echo "📝 Next steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Login with the credentials above"
echo "  3. Connect your WhatsApp device"
echo "  4. Start building automation flows"
echo ""
echo "📖 Documentation: https://github.com/ajie9988/trensai-crm"
echo "💬 Support: https://github.com/ajie9988/trensai-crm/discussions"
