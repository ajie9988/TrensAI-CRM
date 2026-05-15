# API Documentation

## Overview

TrensAI CRM provides a comprehensive REST API for all operations.

**Base URL**: `http://localhost:8000/api/v1`

**Authentication**: Bearer Token (Sanctum)

## Authentication Endpoints

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "password_confirmation": "securepass123"
}
```

**Response**: `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "tenant_id": 1
  },
  "token": "1|eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepass123"
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer {token}
```

### Get Current User

```http
GET /auth/me
Authorization: Bearer {token}
```

---

## Chat Endpoints

### Get Conversations

```http
GET /chat/conversations?device_id=1&limit=50
Authorization: Bearer {token}
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "conversation_id": "conv_123",
      "status": "open",
      "unread_count": 2,
      "contact": {
        "id": 1,
        "phone_number": "1234567890",
        "name": "Customer Name",
        "tags": ["vip", "support"]
      },
      "assigned_user": null,
      "last_message_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Messages

```http
GET /chat/conversations/{id}/messages?limit=50&offset=0
Authorization: Bearer {token}
```

### Send Message

```http
POST /chat/conversations/{id}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Hello! How can I help?",
  "type": "text"
}
```

### Mark Message as Read

```http
PUT /chat/messages/{id}/read
Authorization: Bearer {token}
```

### Assign Conversation

```http
PUT /chat/conversations/{id}/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 2
}
```

---

## Contact Endpoints

### List Contacts

```http
GET /contacts?page=1&limit=50
Authorization: Bearer {token}
```

### Create Contact

```http
POST /contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone_number": "1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "tags": ["customer", "vip"],
  "notes": "Premium customer"
}
```

### Get Contact

```http
GET /contacts/{id}
Authorization: Bearer {token}
```

### Update Contact

```http
PUT /contacts/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "notes": "Updated notes"
}
```

### Add Tag to Contact

```http
POST /contacts/{id}/tags
Authorization: Bearer {token}
Content-Type: application/json

{
  "tag": "priority"
}
```

### Delete Contact

```http
DELETE /contacts/{id}
Authorization: Bearer {token}
```

---

## Device Endpoints

### List Devices

```http
GET /devices
Authorization: Bearer {token}
```

### Create Device

```http
POST /devices
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone_number": "1234567890",
  "device_name": "My Device",
  "webhook_url": "https://webhook.example.com/wa"
}
```

### Get QR Code

```http
GET /devices/{id}/qr
Authorization: Bearer {token}
```

**Response**:
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgo..."
}
```

### Disconnect Device

```http
POST /devices/{id}/disconnect
Authorization: Bearer {token}
```

---

## Broadcast Endpoints

### List Broadcasts

```http
GET /broadcasts?page=1
Authorization: Bearer {token}
```

### Create Broadcast

```http
POST /broadcasts
Authorization: Bearer {token}
Content-Type: application/json

{
  "device_id": 1,
  "name": "Welcome Campaign",
  "message": "Welcome to our service!",
  "target_contacts": [1, 2, 3],
  "target_tags": ["new_customer"],
  "delay_ms": 1000,
  "scheduled_at": "2024-01-20T10:00:00Z"
}
```

### Send Broadcast

```http
POST /broadcasts/{id}/send
Authorization: Bearer {token}
```

### Get Broadcast Status

```http
GET /broadcasts/{id}/status
Authorization: Bearer {token}
```

**Response**:
```json
{
  "data": {
    "status": "sending",
    "total": 100,
    "sent": 45,
    "failed": 2,
    "progress": 45
  }
}
```

---

## Flow Endpoints

### List Flows

```http
GET /flows?page=1
Authorization: Bearer {token}
```

### Create Flow

```http
POST /flows
Authorization: Bearer {token}
Content-Type: application/json

{
  "device_id": 1,
  "name": "Welcome Flow",
  "description": "Welcome new customers",
  "trigger_type": "keyword",
  "trigger_value": "hello",
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger",
      "data": { "keyword": "hello" }
    },
    {
      "id": "node_2",
      "type": "message",
      "data": { "text": "Hello! How can I help?" }
    }
  ],
  "edges": [
    {
      "source": "node_1",
      "target": "node_2"
    }
  ]
}
```

### Execute Flow

```http
POST /flows/{id}/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "contact_id": 1,
  "context": {
    "previous_message": "Hi there",
    "user_name": "John"
  }
}
```

### Get Flow Logs

```http
GET /flows/{id}/logs?page=1
Authorization: Bearer {token}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "message": "This action is unauthorized."
}
```

### 404 Not Found
```json
{
  "message": "Resource not found."
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many attempts. Please try again in 60 seconds."
}
```

### 500 Server Error
```json
{
  "message": "Server error. Please try again later."
}
```

---

## Rate Limiting

- **Free Tier**: 100 requests per minute
- **Pro Tier**: 1000 requests per minute
- **Enterprise**: Unlimited

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703001600
```

---

## Pagination

List endpoints support pagination:

```http
GET /contacts?page=2&limit=50&sort=-created_at
```

**Response**:
```json
{
  "data": [...],
  "meta": {
    "current_page": 2,
    "from": 51,
    "last_page": 10,
    "per_page": 50,
    "to": 100,
    "total": 500
  },
  "links": {
    "first": "...",
    "last": "...",
    "next": "...",
    "prev": "..."
  }
}
```

---

## WebSocket Events

Connect to `ws://localhost:8000/socket.io`:

### Available Events

```javascript
// Listen for new messages
socket.on('message.created', (data) => {
  console.log('New message:', data);
});

// Listen for conversation updates
socket.on('conversation.updated', (data) => {
  console.log('Conversation updated:', data);
});

// Listen for device status
socket.on('device.connected', (data) => {
  console.log('Device connected:', data);
});

// Listen for flow execution
socket.on('flow.executed', (data) => {
  console.log('Flow executed:', data);
});
```

### Emit Events

```javascript
// Join conversation room
socket.emit('join', { conversation_id: 1 });

// Leave conversation room
socket.emit('leave', { conversation_id: 1 });

// Typing indicator
socket.emit('typing', { conversation_id: 1, is_typing: true });
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Login
const { data } = await api.post('/api/v1/auth/login', {
  email: 'user@example.com',
  password: 'password123',
});

// Set token
api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

// Get conversations
const conversations = await api.get('/api/v1/chat/conversations?device_id=1');
```

### Python

```python
import requests

api_url = 'http://localhost:8000/api/v1'

# Login
response = requests.post(f'{api_url}/auth/login', json={
    'email': 'user@example.com',
    'password': 'password123'
})
token = response.json()['token']

headers = {'Authorization': f'Bearer {token}'}

# Get contacts
contacts = requests.get(f'{api_url}/contacts', headers=headers)
print(contacts.json())
```

### cURL

```bash
# Login
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.token')

# Get contacts
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/contacts
```

---

## Support

For API support:
- 📧 [Email](mailto:api-support@example.com)
- 💬 [GitHub Discussions](https://github.com/ajie9988/trensai-crm/discussions)
- 📖 [Full Documentation](./docs/)
