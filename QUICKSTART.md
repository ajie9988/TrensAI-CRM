# Quick Reference Guide

## 🚀 Getting Started

### Option 1: Automated Setup (Recommended)
```bash
cd trensai-crm
bash scripts/setup.sh
```

### Option 2: Manual Setup
```bash
cd trensai-crm
cp .env.example .env
docker compose up -d
docker compose exec backend php artisan migrate:fresh --seed
```

## 📱 Access Points

| Service | URL | Port |
|---------|-----|------|
| Dashboard | http://localhost:3000 | 3000 |
| API | http://localhost:8000 | 8000 |
| WhatsApp Engine | http://localhost:3001 | 3001 |
| AI Engine | http://localhost:3002 | 3002 |
| MySQL | localhost:3306 | 3306 |
| Redis | localhost:6379 | 6379 |

## 👤 Default Credentials
- **Email:** admin@trensai.local
- **Password:** password

## 🛠️ Common Commands

### Local Development (Without Docker)
Untuk menjalankan aplikasi secara lokal di sistem Anda (sangat disarankan saat tahap *development*), Anda perlu membuka **4 terminal terpisah** dan menjalankan perintah berikut di masing-masing foldernya:

```bash
# Terminal 1: Backend Laravel
cd apps/backend
php artisan serve

# Terminal 2: Frontend Next.js
cd apps/frontend
npm run dev

# Terminal 3: WhatsApp Engine
cd apps/wa-engine
npm run dev

# Terminal 4: AI Engine
cd apps/ai-engine
npm run dev
```

*(Catatan: Pastikan Anda juga memiliki server MySQL dan Redis yang aktif di background).*

### Backend (Docker)
```bash
# Run migrations
docker compose exec backend php artisan migrate

# Create admin user
docker compose exec backend php artisan tinker
>>> User::factory()->create(['email' => 'test@example.com'])

# View logs
docker compose logs -f backend

# Access shell
docker compose exec backend bash
```

### Frontend (Docker)
```bash
# Rebuild frontend
docker compose exec frontend npm run build

# Install packages
docker compose exec frontend npm install

# Check logs
docker compose logs -f frontend
```

### Database
```bash
# Access MySQL
docker compose exec mysql mysql -u root -ppassword

# Access Redis
docker compose exec redis redis-cli

# Backup database
bash scripts/backup.sh
```

### Services (Docker)
```bash
# Restart all
docker compose restart

# Stop all
docker compose down

# View status
docker compose ps

# View logs (all)
docker compose logs -f

# View logs (specific)
docker compose logs -f backend
```

## 📁 Project Structure

```
trensai-crm/
├── apps/
│   ├── backend/          # Laravel 11 API (Core CRM)
│   ├── frontend/         # Next.js 14 Dashboard
│   ├── wa-engine/        # Baileys WhatsApp Server
│   ├── ai-engine/        # AI Service (Gemini, dll)
│   └── worker/           # Background jobs
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── docker/               # Docker configs
├── docker-compose.yml    # Stack definition
└── .env.example          # Environment template
```

## 📚 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [README.md](./README.md) | Project overview | 5 min |
| [INSTALL.md](./docs/INSTALL.md) | Installation guide | 10 min |
| [API.md](./docs/API.md) | API reference | 15 min |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design | 10 min |
| [DOCKER.md](./docs/DOCKER.md) | Docker guide | 10 min |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guide | 10 min |
| [BUILD_SUMMARY.md](./BUILD_SUMMARY.md) | Complete AI & System summary | 10 min |

## 🔧 Configuration

### Environment Variables (.env)

**Backend (.env)**
```env
APP_ENV=local
APP_DEBUG=true
DB_HOST=127.0.0.1
REDIS_HOST=127.0.0.1
QUEUE_CONNECTION=sync # Ubah ke 'redis' untuk production

# Service API Keys (WAJIB SAMA DENGAN ENGINE TERKAIT)
WA_ENGINE_URL=http://127.0.0.1:3001
WA_ENGINE_API_KEY=your_key_here

# AI Configuration
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
```

**Frontend (.env)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
NEXT_PUBLIC_CHAT_REALTIME_METHOD=polling # 'sse' or 'polling'
```

**WhatsApp Engine (.env)**
```env
PORT=3001
API_KEY=your_key_here # WAJIB SAMA dengan WA_ENGINE_API_KEY di backend
REDIS_URL=redis://127.0.0.1:6379
```

**AI Engine (.env)**
```env
PORT=3002
GEMINI_API_KEY=your_google_ai_key
GEMINI_SYSTEM_INSTRUCTION="Anda adalah asisten virtual..."
GEMINI_TEMPERATURE=0.7
```

## 🔌 API Quick Reference

### Authentication
```bash
# Register
POST /api/v1/auth/register
{
  "name": "John",
  "email": "john@example.com",
  "password": "secret",
  "password_confirmation": "secret"
}

# Login
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "secret"
}

# Get current user
GET /api/v1/auth/me
```

### Chat
```bash
# Get conversations
GET /api/v1/chat/conversations

# Get messages
GET /api/v1/chat/conversations/{id}/messages

# Send message
POST /api/v1/chat/conversations/{id}/messages
{
  "content": "Hello!",
  "type": "text"
}

# Mark as read
PUT /api/v1/chat/messages/{id}/read

# Upload Media
POST /api/v1/chat/upload
(Multipart form-data with 'file' field)
```

### Contacts
```bash
# List contacts
GET /api/v1/contacts

# Create contact
POST /api/v1/contacts
{
  "name": "John Doe",
  "phone_number": "+1234567890"
}

# Update contact
PUT /api/v1/contacts/{id}

# Delete contact
DELETE /api/v1/contacts/{id}
```

### Devices
```bash
# List devices
GET /api/v1/devices

# Get QR code
GET /api/v1/devices/{id}/qr

# Disconnect device
POST /api/v1/devices/{id}/disconnect
```

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
docker compose exec backend php artisan test

# Run specific test
docker compose exec backend php artisan test tests/Feature/AuthTest.php

# Run with coverage
docker compose exec backend php artisan test --coverage
```

### Frontend Tests
```bash
# Run Jest tests
docker compose exec frontend npm test

# Run with coverage
docker compose exec frontend npm test -- --coverage
```

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs
docker compose logs -f <service_name>

# Check health
docker compose exec <service_name> /health
```

### Database Connection Error
```bash
# Verify MySQL is running
docker compose ps mysql

# Test connection
docker compose exec mysql mysql -u root -ppassword123 -e "SELECT 1"
```

### Port Already in Use
```bash
# Find process
lsof -i :<port>

# Kill process
kill -9 <pid>
```

### Redis Connection Error
```bash
# Check Redis is running
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping
```

## 📊 Performance Tips

### Caching
- Frontend: React Query caching
- Backend: Redis caching layer
- Database: Query optimization

### Database
```sql
-- Check slow queries
SELECT * FROM mysql.slow_log;

-- Optimize tables
OPTIMIZE TABLE messages, contacts, conversations;
```

### Frontend
```bash
# Check bundle size
npm run build -- --analyze

# Lighthouse audit
npm run build && npm start
```

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Update .env with strong secrets
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS for your domain
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

## 🚀 Deployment

### Build Production Images
```bash
docker compose build --no-cache
```

### Deploy to Server
```bash
# Via Docker
docker compose -f docker-compose.prod.yml up -d

# Via Kubernetes
kubectl apply -f k8s/
```

## 📖 Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## 💡 Tips

1. **Always backup before major updates**
   ```bash
   bash scripts/backup.sh
   ```

2. **Use environment variables for secrets**
   - Never commit .env to Git
   - Use .env.example as template

3. **Monitor logs regularly**
   ```bash
   docker compose logs -f --tail=100
   ```

4. **Update dependencies**
   ```bash
   # Backend
   docker compose exec backend composer update

   # Frontend
   docker compose exec frontend npm update
   ```

5. **Keep Docker clean**
   ```bash
   bash scripts/cleanup.sh
   ```

## 🆘 Support

- 📖 Read the docs first
- 🔍 Check GitHub issues
- 💬 Ask in community forums
- 📧 Email support team

---

**Version 1.1.0** | [GitHub](https://github.com/ajie9988/trensai-crm) | [Docs](./docs/) | [API Reference](./docs/API.md)
