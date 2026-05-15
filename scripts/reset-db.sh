#!/bin/bash

# Reset database to fresh state

set -e

echo "🔄 Resetting database..."

docker-compose exec backend php artisan migrate:rollback --step=999
docker-compose exec backend php artisan migrate:fresh --seed

echo "✅ Database reset complete!"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@example.com"
echo "  Password: password123"
