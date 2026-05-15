# Architecture Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│              (Web, Mobile, Desktop, SDKs)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼─────┐   ┌────▼────────┐   ┌─▼─────────┐
    │  Nginx    │   │ Socket.IO   │   │ Websocket │
    │  (Proxy)  │   │  (Real-time)│   │  Events   │
    └────┬─────┘   └────┬────────┘   └─┬─────────┘
         │               │               │
    ┌────▴──────────────┴───────────────┴─────┐
    │                                          │
    │       ┌──────────────────────┐           │
    │       │   BACKEND API        │           │
    │       │   (Laravel 11)       │           │
    │       │  ┌────────────────┐  │           │
    │       │  │   Modules      │  │           │
    │       │  ├────────────────┤  │           │
    │       │  │ Auth           │  │           │
    │       │  │ Tenant         │  │           │
    │       │  │ User           │  │           │
    │       │  │ Device         │  │           │
    │       │  │ Chat           │  │           │
    │       │  │ Contact        │  │           │
    │       │  │ Broadcast      │  │           │
    │       │  │ Flow           │  │           │
    │       │  │ AI             │  │           │
    │       │  │ CRM            │  │           │
    │       │  │ Analytics      │  │           │
    │       │  └────────────────┘  │           │
    │       └──────────────────────┘           │
    │                                          │
    │  ┌──────────────┐    ┌─────────────┐   │
    │  │ Queue Worker │    │ Scheduler   │   │
    │  │ (Redis)      │    │ (Task Jobs) │   │
    │  └──────────────┘    └─────────────┘   │
    └────┬──────────────────────────────────┬─┘
         │                                   │
    ┌────▼──────────────┐         ┌─────────▼──┐
    │  MySQL Database   │         │ Redis      │
    │                   │         │ (Cache &   │
    │  ┌─────────────┐  │         │  Queue)    │
    │  │ Tenants     │  │         └────────────┘
    │  │ Users       │  │
    │  │ Devices     │  │
    │  │ Contacts    │  │
    │  │ Messages    │  │
    │  │ Flows       │  │
    │  │ Broadcasts  │  │
    │  │ Logs        │  │
    │  └─────────────┘  │
    └───────────────────┘
         │
         ├─────────────────────────┬──────────────┐
         │                         │              │
    ┌────▼──────┐    ┌─────────────▼──┐   ┌──────▼──┐
    │ Frontend   │    │ WhatsApp Engine│   │ AI      │
    │ (Next.js)  │    │ (Baileys)      │   │ Engine  │
    │            │    │                │   │         │
    │ Dashboard  │    │ WebSocket API  │   │ OpenAI  │
    │ Inbox      │    │ Session Mgmt   │   │ Claude  │
    │ Contacts   │    │ Message Sync   │   │ Gemini  │
    │ Broadcasts │    │ Device Status  │   │ Ollama  │
    │ Flows      │    │ QR Generation  │   └─────────┘
    │            │    │                │
    │ Analytics  │    └────────────────┘
    └────────────┘
```

## Module Architecture

### Core Modules

```
Modules/
├── Auth/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   └── TokenController.php
│   ├── Services/
│   │   ├── AuthService.php
│   │   └── TokenService.php
│   ├── Models/
│   │   └── User.php (with relationships)
│   ├── Events/
│   │   ├── UserRegistered.php
│   │   └── UserLoggedIn.php
│   ├── Jobs/
│   │   ├── SendWelcomeEmail.php
│   │   └── LogLoginActivity.php
│   ├── Requests/
│   │   ├── LoginRequest.php
│   │   └── RegisterRequest.php
│   └── Routes/
│       └── api.php
│
├── Chat/
│   ├── Controllers/
│   │   ├── ConversationController.php
│   │   ├── MessageController.php
│   │   └── WebhookController.php
│   ├── Services/
│   │   ├── ChatService.php
│   │   ├── MessageService.php
│   │   └── WebhookService.php
│   ├── Models/
│   │   ├── Conversation.php
│   │   └── Message.php
│   ├── Events/
│   │   ├── MessageCreated.php
│   │   ├── MessageRead.php
│   │   └── ConversationAssigned.php
│   ├── Jobs/
│   │   ├── ProcessMessage.php
│   │   ├── DeliverMessage.php
│   │   └── SyncMessage.php
│   └── Repositories/
│       ├── ConversationRepository.php
│       └── MessageRepository.php
│
├── Flow/
│   ├── Controllers/
│   │   ├── FlowController.php
│   │   └── FlowExecutorController.php
│   ├── Services/
│   │   ├── FlowService.php
│   │   ├── FlowExecutorService.php
│   │   ├── FlowBuilder.php
│   │   └── NodeExecutor.php
│   ├── Models/
│   │   ├── Flow.php
│   │   └── FlowLog.php
│   ├── Nodes/
│   │   ├── TriggerNode.php
│   │   ├── ConditionNode.php
│   │   ├── ActionNode.php
│   │   ├── WebhookNode.php
│   │   ├── AINode.php
│   │   └── DelayNode.php
│   └── Jobs/
│       ├── ExecuteFlow.php
│       └── ExecuteNode.php
│
├── Broadcast/
│   ├── Controllers/
│   │   └── BroadcastController.php
│   ├── Services/
│   │   ├── BroadcastService.php
│   │   └── BroadcastScheduler.php
│   ├── Models/
│   │   └── Broadcast.php
│   ├── Jobs/
│   │   ├── SendBroadcast.php
│   │   └── RetryFailedBroadcast.php
│   └── Repositories/
│       └── BroadcastRepository.php
│
└── AI/
    ├── Controllers/
    │   └── AIController.php
    ├── Services/
    │   ├── AIService.php
    │   ├── ProviderManager.php
    │   └── PromptBuilder.php
    ├── Providers/
    │   ├── OpenAIProvider.php
    │   ├── AnthropicProvider.php
    │   ├── GeminiProvider.php
    │   └── OllamaProvider.php
    ├── Models/
    │   └── AILog.php
    └── Jobs/
        └── ProcessAIRequest.php
```

## Data Flow

### Message Flow

```
WhatsApp Message
       │
       ▼
WhatsApp Engine (Baileys)
       │
       ├─► Parse message
       ├─► Format as JSON
       ├─► Validate signature
       │
       ▼
Backend Webhook Receiver
       │
       ├─► Find/Create Contact
       ├─► Find/Create Conversation
       ├─► Store Message
       ├─► Update statistics
       │
       ├─► Dispatch Events
       │   ├─► MessageCreated event
       │   ├─► Broadcast to WebSocket
       │   └─► Queue processing jobs
       │
       ├─► Queue Jobs
       │   ├─► ProcessMessage job
       │   ├─► CheckFlow job
       │   ├─► CheckAI job
       │   └─► AnalyzeMessage job
       │
       ├─► Flow Execution
       │   ├─► Match triggers
       │   ├─► Execute nodes
       │   ├─► Send response
       │   └─► Log execution
       │
       ├─► AI Processing
       │   ├─► Detect intent
       │   ├─► Generate response
       │   ├─► Send via WhatsApp
       │   └─► Log to database
       │
       └─► Frontend Notification
           └─► Real-time sync via WebSocket
```

### Authentication Flow

```
User Login
    │
    ▼
POST /api/v1/auth/login
    │
    ├─► Validate input
    ├─► Find user by email
    ├─► Verify password hash
    ├─► Update last_login_at
    │
    ├─► Generate token
    │   └─► Sanctum creates API token
    │
    ├─► Return token to client
    │
    ▼
Client stores token
    │
    ├─► localStorage.setItem('auth_token', token)
    ├─► axios.defaults.headers.Authorization = `Bearer ${token}`
    │
    ▼
Subsequent requests
    │
    ├─► Include token in header
    ├─► Middleware validates token
    ├─► Attach authenticated user to request
    └─► Execute controller action
```

### Broadcast Flow

```
Create Broadcast
    │
    ▼
Queue BroadcastJob
    │
    ├─► Get target contacts/tags
    ├─► Split into batches
    │
    ▼
For each batch:
    ├─► Format message
    ├─► Apply template variables
    ├─► Randomize delay
    │
    ├─► Send via WhatsApp Engine
    │   ├─► Call WhatsApp API
    │   ├─► Track delivery status
    │   └─► Update message status
    │
    ├─► Log delivery
    ├─► Update statistics
    └─► Retry on failure
```

## Multi-Tenancy

```
Request from Client
    │
    ▼
TenantMiddleware
    │
    ├─► Extract tenant_id from:
    │   ├─► X-Tenant-ID header
    │   └─► Authenticated user's tenant_id
    │
    ├─► Verify user belongs to tenant
    ├─► Set request.tenant_id
    │
    ▼
Controller/Service
    │
    ├─► All queries include tenant_id filter
    ├─► Data isolation enforced
    ├─► Cross-tenant access prevented
    │
    ▼
Database Query
    │
    └─► WHERE tenant_id = {user's_tenant_id}
```

## Deployment Architecture

### Single Server
```
┌─────────────────────────────────┐
│    Docker Host (2GB RAM+)       │
│                                 │
│  ┌──────────────────────────┐   │
│  │  Docker Compose Stack    │   │
│  │                          │   │
│  │  nginx ← frontend        │   │
│  │    ├── backend           │   │
│  │    ├── wa-engine         │   │
│  │    ├── ai-engine         │   │
│  │    ├── mysql             │   │
│  │    └── redis             │   │
│  │                          │   │
│  └──────────────────────────┘   │
│                                 │
│  Volumes:                       │
│  ├── mysql_data                 │
│  ├── redis_data                 │
│  └── wa_sessions                │
│                                 │
└─────────────────────────────────┘
```

### Clustered Deployment
```
┌──────────────────────────────────────────────┐
│           Load Balancer (Nginx)              │
│  (Session stickiness for WhatsApp sync)      │
└──────────────────┬───────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
    │ API 1│  │ API 2│  │ API 3│
    └───┬──┘  └───┬──┘  └───┬──┘
        │         │         │
        └─────────┼─────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
    ┌───▼──┐  ┌──▼───┐  ┌──▼───┐
    │MySQL │  │Redis │  │RabbitMQ
    │Cluster   │Cluster  │Worker
    └───────┘  └───────┘  └──────┘
```

## Security Architecture

```
┌─────────────────────────────────────┐
│       Security Layers               │
├─────────────────────────────────────┤
│ 1. Network Security                 │
│    ├── HTTPS/TLS encryption         │
│    ├── Firewall rules               │
│    └── Rate limiting                │
├─────────────────────────────────────┤
│ 2. Application Security             │
│    ├── Input validation             │
│    ├── Output encoding              │
│    ├── CSRF protection              │
│    └── SQL injection prevention     │
├─────────────────────────────────────┤
│ 3. Authentication                   │
│    ├── Password hashing (bcrypt)    │
│    ├── API token (Sanctum)          │
│    ├── Session management           │
│    └── 2FA ready                    │
├─────────────────────────────────────┤
│ 4. Authorization                    │
│    ├── Role-based access (RBAC)     │
│    ├── Tenant isolation             │
│    ├── Resource permissions         │
│    └── Audit logging                │
├─────────────────────────────────────┤
│ 5. Data Security                    │
│    ├── Encryption at rest           │
│    ├── Encrypted sessions           │
│    ├── Data retention               │
│    └── GDPR compliance              │
└─────────────────────────────────────┘
```

## Performance Optimization

### Caching Strategy
```
┌────────────┐
│  Request   │
└────────┬───┘
         │
    ┌────▼──────┐
    │ Redis     │
    │ Cache     │
    └────┬──────┘
         │
    (Hit/Miss)
    ├─ Hit  ───► Return cached data
    │
    └─ Miss ──► Query Database
                 │
                 ├─ Store in cache
                 ├─ Expire after 5min
                 └─ Return to client
```

### Queue Processing
```
Request arrives
    │
    ├─► Sync (immediate response)
    │   ├─► Authentication
    │   ├─► Data validation
    │   └─► Database writes
    │
    └─► Async (background jobs)
        ├─► Message processing
        ├─► AI requests
        ├─► Broadcasting
        ├─► Flow execution
        ├─► Webhook delivery
        └─► Analytics
```

## Monitoring & Observability

```
Application
    │
    ├─► Logs (Pino/PHP logs)
    │   └─► File: storage/logs/
    │
    ├─► Metrics (PHP-FPM, MySQL)
    │   └─► Monitor: CPU, Memory, Disk
    │
    ├─► Health Checks
    │   ├─► GET /health
    │   ├─► Database connectivity
    │   ├─► Redis connectivity
    │   └─► WhatsApp engine status
    │
    ├─► Errors (Exception handling)
    │   ├─► Log level: error
    │   ├─► Sentry integration ready
    │   └─► Email notifications
    │
    └─► Performance (APM)
        ├─► Query timing
        ├─► Endpoint latency
        └─► Queue processing time
```

---

## See Also

- [API Documentation](./API.md)
- [Installation Guide](./INSTALL.md)
- [Docker Setup](./DOCKER.md)
