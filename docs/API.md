# API Documentation

## Authentication

### API Keys
All API requests require an API key in the `Authorization` header:

```
Authorization: Bearer <api_key>
```

API keys are scoped to an organization and stored as hashes. The raw key is only shown once upon creation.

### Rate Limits
- **Default:** 60 requests per minute per API key
- **Burst:** 120 requests per minute
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Base URL

```
Production: https://api.workos.com/v1
Development: http://localhost:3000/api
```

## Endpoints

### CRM

#### People

**List People**
```
GET /api/people
Query params:
  - orgId: string (required)
  - page?: number (default: 1)
  - limit?: number (default: 50)
  - search?: string
  - companyId?: string
  - tags?: string[]
```

**Get Person**
```
GET /api/people/:id
Query params:
  - orgId: string (required)
```

**Create Person**
```
POST /api/people
Body: {
  orgId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  companyId?: string
  title?: string
  tags?: string[]
}
```

**Update Person**
```
PATCH /api/people/:id
Body: { ...partial person fields }
```

**Delete Person**
```
DELETE /api/people/:id
Query params:
  - orgId: string (required)
```

#### Companies

Similar structure to People endpoints:
- `GET /api/companies`
- `GET /api/companies/:id`
- `POST /api/companies`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`

#### Deals

**List Deals**
```
GET /api/deals
Query params:
  - orgId: string (required)
  - pipelineId?: string
  - stageId?: string
  - status?: 'open' | 'won' | 'lost'
```

**Get Deal**
```
GET /api/deals/:id
```

**Create Deal**
```
POST /api/deals
Body: {
  orgId: string
  name: string
  pipelineId: string
  stageId: string
  companyId?: string
  personId?: string
  valueCents: number
  currency: string
  ownerId?: string
  expectedCloseDate?: string
}
```

**Update Deal**
```
PATCH /api/deals/:id
Body: { ...partial deal fields }
```

**Move Deal**
```
POST /api/deals/:id/move
Body: {
  stageId: string
}
```

#### Tasks

**List Tasks**
```
GET /api/tasks
Query params:
  - orgId: string (required)
  - status?: 'pending' | 'completed'
  - ownerId?: string
```

**Create Task**
```
POST /api/tasks
Body: {
  orgId: string
  title: string
  dueAt?: string
  priority?: 'low' | 'medium' | 'high'
  ownerId?: string
  companyId?: string
  personId?: string
  dealId?: string
}
```

**Complete Task**
```
POST /api/tasks/:id/complete
```

### Communications

#### Send Email
```
POST /api/email/send
Body: {
  orgId: string
  personId?: string
  to?: string (email)
  subject: string
  html: string
}
```

#### Send SMS
```
POST /api/sms/send
Body: {
  orgId: string
  personId?: string
  to?: string (E.164 format)
  from: string (Twilio number)
  body: string (max 800 chars)
}
```

#### List Interactions
```
GET /api/interactions
Query params:
  - orgId: string (required)
  - personId?: string
  - companyId?: string
  - dealId?: string
  - type?: 'note' | 'email' | 'sms' | 'call'
```

### Webhooks

#### List Webhooks
```
GET /api/webhooks
Query params:
  - orgId: string (required)
```

#### Create Webhook
```
POST /api/webhooks
Body: {
  orgId: string
  url: string
  secret: string
  eventTypes: string[]
}
```

#### Update Webhook
```
PATCH /api/webhooks/:id
Body: {
  url?: string
  secret?: string
  eventTypes?: string[]
  enabled?: boolean
}
```

#### Delete Webhook
```
DELETE /api/webhooks/:id
```

### API Keys Management

#### List API Keys
```
GET /api/api-keys
Query params:
  - orgId: string (required)
```

#### Create API Key
```
POST /api/api-keys
Body: {
  orgId: string
  name: string
}
Response: {
  id: string
  name: string
  key: string  // Only shown once!
  createdAt: string
}
```

#### Revoke API Key
```
DELETE /api/api-keys/:id
```

## Webhook Events

### Event Types

- `org.created`
- `person.created`, `person.updated`, `person.deleted`
- `company.created`, `company.updated`, `company.deleted`
- `deal.created`, `deal.updated`, `deal.moved`, `deal.won`, `deal.lost`
- `task.created`, `task.completed`
- `email.sent`, `email.received`
- `sms.sent`, `sms.received`
- `call.started`, `call.ended`
- `lead.created` (Phase 1b)
- `integration.connected`, `integration.disconnected`

### Webhook Payload

```json
{
  "id": "evt_...",
  "type": "person.created",
  "entity": "person",
  "entityId": "uuid",
  "orgId": "uuid",
  "payload": {
    // Event-specific data
  },
  "occurredAt": "2025-11-12T10:00:00Z"
}
```

### Webhook Signature

All webhook payloads include an `X-Signature` header:

```
X-Signature: sha256=<hmac_sha256_signature>
```

Verify signature:
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### Error Codes

- `UNAUTHORIZED` - Missing or invalid API key
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Pagination

List endpoints support pagination:

```
GET /api/people?page=1&limit=50
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering & Search

Most list endpoints support:
- `search` - Full-text search across relevant fields
- `tags` - Filter by tags (array)
- Date ranges for time-based queries
- Status filters where applicable

## Examples

### Create a Person and Send Email

```bash
# Create person
curl -X POST https://api.workos.com/v1/api/people \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org_123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }'

# Send email
curl -X POST https://api.workos.com/v1/api/email/send \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org_123",
    "personId": "person_456",
    "subject": "Welcome!",
    "html": "<h1>Welcome to WorkOS</h1>"
  }'
```

