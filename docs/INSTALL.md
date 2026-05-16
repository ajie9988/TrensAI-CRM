# Installation Guide

## Quick Start (30 Seconds)

### Prerequisites
- Docker & Docker Compose installed
- Git
- 2GB+ RAM available

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/ajie9988/trensai-crm.git
cd trensai-crm

# 2. Copy environment file
cp .env.example .env

# 3. Configure environment (optional)
nano .env

# 4. Start services
docker compose up -d

# 5. Wait for services to be ready (2-3 minutes)
docker compose logs -f backend

# 6. Access the platform
# Dashboard: http://localhost:3000
# API: http://localhost:8000/api
# Admin: admin@example.com / password123
```

### Manual Setup (Without Docker)

Cukup gunakan pnpm untuk mengelola semua layanan Node.js sekaligus:

```bash
# 1. Instal pnpm
npm install -g pnpm

# 2. Instal semua dependencies (Monorepo)
pnpm install

# 3. Jalankan semua layanan sekaligus
pnpm dev
```

### Backend Setup (Laravel)
```bash
cd apps/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

## Environment Configuration

Key environment variables in `.env`:

```env
# Database
DB_HOST=mysql
DB_DATABASE=wa_crm
DB_USERNAME=root
DB_PASSWORD=your_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# WhatsApp Engine
WA_ENGINE_URL=http://wa-engine:3001
WA_ENGINE_API_KEY=your_api_key

# AI Configuration
AI_DEFAULT_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

For local MAMP development in this workspace, the verified MySQL settings are `127.0.0.1:3306` with `root/root` and `utf8mb4_unicode_ci`.

## First Steps

1. **Connect WhatsApp Device**
   - Go to Device Manager
   - Click "Add Device"
   - Scan QR Code with your phone
   - Wait for connection confirmation

2. **Import Contacts**
   - Go to Contacts
   - Click "Import"
   - Upload CSV file
   - Wait for processing

3. **Create Automation Flow**
   - Go to Flows
   - Click "Create Flow"
   - Use visual editor
   - Deploy when ready

4. **Connect AI**
   - Go to Settings > AI
   - Configure your AI provider
   - Test the connection

## Troubleshooting

### Services not starting
```bash
# Check logs
docker compose logs backend
docker compose logs wa-engine

# Restart all services
docker compose restart
```

### Database connection failed
```bash
# Check MySQL is ready
docker compose exec mysql mysql -u root -ppassword123 -e "SELECT 1"

# Migrate database
docker compose exec backend php artisan migrate:fresh --seed
```

### WhatsApp connection issues
```bash
# Check QR code
curl http://localhost:3001/qr

# Check device status
curl http://localhost:3001/status
```

### Frontend not loading
```bash
# Check Next.js build
docker compose exec frontend pnpm run build

# Restart frontend
docker compose restart frontend
```

## Production Deployment

### Using Docker Compose

```bash
# Set production environment
export APP_ENV=production
export APP_DEBUG=false

# Build production images
docker compose build

# Deploy
docker compose -f docker-compose.yml up -d
```

### Kubernetes Deployment

See [Kubernetes Deployment Guide](./KUBERNETES.md)

### Reverse Proxy Setup

See [Nginx Configuration Guide](./NGINX.md)

## Backup & Restore

### Backup Database
```bash
docker compose exec mysql mysqldump -u root -ppassword123 wa_crm > backup.sql
```

### Restore Database
```bash
docker compose exec -T mysql mysql -u root -ppassword123 wa_crm < backup.sql
```

### Backup Sessions (WhatsApp)
```bash
docker compose exec wa-engine tar czf sessions.tar.gz sessions/
docker cp wa_crm_wa_engine:/app/sessions.tar.gz ./
```

## Performance Tuning

### MySQL
```sql
-- Optimize tables
OPTIMIZE TABLE tenants, users, contacts, messages;

-- Add indexes
CREATE INDEX idx_tenant_created ON messages(tenant_id, created_at);
```

### Redis
```bash
# Monitor Redis
redis-cli MONITOR

# Check memory
redis-cli INFO memory
```

### PHP-FPM
Edit `.env`:
```env
PHP_FPM_PM_MAX_CHILDREN=100
PHP_FPM_PM_START_SERVERS=20
PHP_FPM_PM_MIN_SPARE_SERVERS=10
PHP_FPM_PM_MAX_SPARE_SERVERS=20
```

## SSL/HTTPS Setup

```bash
# Using Let's Encrypt with Certbot
certbot certonly --standalone -d yourdomain.com

# Update nginx config
# Copy certificates to docker/nginx/certs/
# Modify docker-compose.yml to mount certificates

docker compose restart nginx
```

## Support

- 📖 [Full Documentation](./docs/)
- 🐛 [Report Issues](https://github.com/ajie9988/trensai-crm/issues)
- 💬 [Community Chat](https://github.com/ajie9988/trensai-crm/discussions)
- 📧 [Email Support](mailto:support@example.com)
