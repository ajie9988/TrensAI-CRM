# Docker Deployment Guide

## Docker Compose Setup

### File Structure

```
docker-compose.yml       # Main compose file
docker/
├── nginx/
│   ├── nginx.conf      # Nginx configuration
│   └── conf.d/         # Additional configs
├── mysql/
│   └── my.cnf          # MySQL configuration
└── redis/
    └── redis.conf      # Redis configuration
```

## Building Images

### Build All Services

```bash
docker compose build
```

### Build Specific Service

```bash
# Build backend only
docker compose build backend

# Build with no cache
docker compose build --no-cache backend
```

## Running Services

### Start Services

```bash
# Start all services in background
docker compose up -d

# Start with logs
docker compose up

# Start specific services
docker compose up -d mysql redis backend
```

### Stop Services

```bash
# Stop all services
docker compose down

# Stop specific services
docker compose stop backend frontend

# Stop and remove volumes
docker compose down -v
```

### View Logs

```bash
# View all logs
docker compose logs

# Follow logs (like tail -f)
docker compose logs -f

# View specific service logs
docker compose logs backend

# View last 100 lines
docker compose logs -f --tail=100 backend
```

## Service Management

### Execute Commands

```bash
# Run artisan command
docker compose exec backend php artisan migrate:fresh --seed

# Run NPM command
docker compose exec frontend npm run build

# Access MySQL shell
docker compose exec mysql mysql -u root -ppassword123

# Access Redis CLI
docker compose exec redis redis-cli
```

### Service Restart

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
```

## Database Management

### Initialize Database

```bash
# Fresh migration with seed data
docker compose exec backend php artisan migrate:fresh --seed

# Only run migrations
docker compose exec backend php artisan migrate

# Rollback migrations
docker compose exec backend php artisan migrate:rollback
```

### Backup Database

```bash
# Backup to local file
docker compose exec mysql mysqldump -u root -ppassword123 wa_crm > backup.sql

# Backup with compression
docker compose exec mysql mysqldump -u root -ppassword123 wa_crm | gzip > backup.sql.gz
```

### Restore Database

```bash
# Restore from backup
docker compose exec -T mysql mysql -u root -ppassword123 wa_crm < backup.sql

# Restore from compressed backup
gunzip < backup.sql.gz | docker compose exec -T mysql mysql -u root -ppassword123 wa_crm
```

## Performance Tuning

### Resource Limits

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### MySQL Performance

```bash
# Optimize tables
docker compose exec mysql mysql -u root -ppassword123 wa_crm -e "OPTIMIZE TABLE tenants, users, contacts, messages;"

# Check table sizes
docker compose exec mysql mysql -u root -ppassword123 wa_crm -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) FROM information_schema.tables WHERE table_schema = 'wa_crm';"
```

### Redis Performance

```bash
# Check memory usage
docker compose exec redis redis-cli INFO memory

# Monitor commands
docker compose exec redis redis-cli MONITOR

# Flush database (WARNING: loses data)
docker compose exec redis redis-cli FLUSHDB
```

## Networking

### Service Communication

Services communicate via hostnames:

```
backend → mysql:3306
backend → redis:6379
wa-engine → backend:8000
frontend → backend:8000 (via nginx)
```

### Expose Ports

```yaml
ports:
  - "80:80"      # Nginx HTTP
  - "443:443"    # Nginx HTTPS
  - "3306:3306"  # MySQL (local development)
  - "6379:6379"  # Redis (local development)
```

### Custom Network

Create additional networks:

```bash
docker network create wa_crm_external
docker compose -f docker-compose.yml -f docker-compose.external.yml up -d
```

## Volumes

### Persistent Data

```yaml
volumes:
  mysql_data:
    driver: local
  redis_data:
    driver: local
  backend_storage:
    driver: local
```

### Backup Volumes

```bash
# Backup volume
docker run --rm \
  -v wa_crm_mysql_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mysql_backup.tar.gz -C /data .

# Restore volume
docker run --rm \
  -v wa_crm_mysql_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mysql_backup.tar.gz -C /data
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker images
        run: docker compose build
      
      - name: Run tests
        run: docker compose run --rm backend php artisan test
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker compose push
      
      - name: Deploy
        run: |
          ssh -i ~/.ssh/deploy_key deploy@server.com 'cd /app && docker compose pull && docker compose up -d'
```

## Environment Variables

### Backend

```env
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...
DB_HOST=mysql
DB_DATABASE=wa_crm
REDIS_HOST=redis
QUEUE_CONNECTION=redis
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
NODE_ENV=production
```

### WhatsApp Engine

```env
PORT=3001
REDIS_HOST=redis
BACKEND_URL=http://backend:8000
API_KEY=your_key
```

### AI Engine

```env
PORT=3002
BACKEND_URL=http://backend:8000
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Health Checks

### Service Health

```bash
# Nginx health
curl http://localhost/health

# Backend API health
curl http://localhost:8000/health

# WhatsApp Engine
curl http://localhost:3001/health

# AI Engine
curl http://localhost:3002/health
```

### Database Health

```bash
# Check MySQL
docker compose exec mysql mysqladmin -u root -ppassword123 ping

# Check Redis
docker compose exec redis redis-cli ping
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs backend

# Check configuration
docker compose config

# Validate services
docker compose ps
```

### Port Already in Use

```bash
# Find process using port
lsof -i :80
lsof -i :3306

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "8080:80"  # Changed from 80
```

### Out of Disk Space

```bash
# Clean up unused images
docker image prune

# Clean up unused volumes
docker volume prune

# Clean up unused networks
docker network prune

# Full cleanup
docker system prune
```

### Database Connection Issues

```bash
# Check MySQL is running
docker compose ps mysql

# Check port binding
netstat -an | grep 3306

# Test connection
docker compose exec backend php artisan tinker
>>> DB::connection()->getPdo();
```

### Redis Connection Issues

```bash
# Check Redis is running
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping

# Check Redis config
docker compose exec redis redis-cli CONFIG GET "*"
```

## Production Deployment

### Scale Services

```yaml
services:
  backend:
    deploy:
      replicas: 3
  worker:
    deploy:
      replicas: 2
```

Scale with Docker Compose:
```bash
docker compose up -d --scale backend=3 --scale worker=2
```

### Load Balancing

Use Nginx upstream:

```nginx
upstream backend {
  server backend-1:8000;
  server backend-2:8000;
  server backend-3:8000;
}
```

### Monitoring

```bash
# Use Portainer for GUI
docker run -d \
  --name portainer \
  -p 8000:8000 \
  -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  portainer/portainer-ce
```

Access at http://localhost:9000

## Security

### Network Isolation

```yaml
networks:
  internal:
    internal: true  # No external access
  external:
    # Public access
```

### Image Security

```bash
# Scan for vulnerabilities
docker scan trensai-crm-backend

# Use specific versions
FROM php:8.3-fpm-alpine
```

### Secret Management

```bash
# Use Docker secrets
echo "password123" | docker secret create db_password -

# Use environment files
docker compose --env-file .env.production up -d
```

## Support

- 📧 [Email Support](mailto:docker-support@example.com)
- 🐛 [Report Issues](https://github.com/ajie9988/trensai-crm/issues)
- 📖 [Docker Documentation](https://docs.docker.com/)
