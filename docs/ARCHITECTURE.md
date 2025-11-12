# Architecture Overview

## System Architecture

WorkOS is built as a modular, multi-tenant SaaS platform with the following architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│              Next.js App Router + React                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                    Vercel Edge Network                      │
│              Next.js API Routes + Middleware                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────┐
│   Supabase   │ │  Gmail API │ │  Twilio API    │
│  PostgreSQL  │ │            │ │                │
│  Auth + RLS  │ │            │ │                │
│ Edge Funcs   │ │            │ │                │
└──────────────┘ └────────────┘ └────────────────┘
```

## Core Principles

1. **Multi-tenancy:** All data is scoped by `org_id` with Row Level Security (RLS)
2. **Event-driven:** Domain events for webhooks and audit trails
3. **Modular:** Each feature module (CRM, Lead-Gen, etc.) is independently deployable
4. **API-first:** RESTful API with webhook support for integrations
5. **Security:** RLS everywhere, encrypted tokens, HMAC-signed webhooks

## Data Flow

### Authentication Flow
```
User → Supabase Auth → JWT Token → RLS Policies → Data Access
```

### Email Send Flow
```
UI → /api/email/send → Fetch Gmail Token (Edge Function) → 
Gmail API → Store in DB → Emit Event → Webhook Delivery
```

### SMS Inbound Flow
```
Twilio → /api/webhooks/twilio/sms → Validate Signature → 
Resolve Org/Person → Store SMS → Create Interaction → 
Emit Event → Webhook Delivery
```

## Module Structure

### `/apps/web`
- **`/app`** - Next.js App Router pages
- **`/app/api`** - API route handlers
- **`/components`** - Reusable UI components (shadcn/ui)
- **`/lib`** - Shared utilities, Supabase client, helpers
- **`/modules`** - Feature modules:
  - `crm` - CRM core functionality
  - `prospecting` - Lead generation
  - `comms` - Email/SMS/Call handling
- **`/types`** - TypeScript type definitions

### `/supabase`
- **`/migrations`** - Database schema migrations
- **`/functions`** - Edge Functions for serverless operations

## Database Architecture

### Multi-tenant Core
- `orgs` - Organizations (tenants)
- `org_members` - User-org relationships with roles

### CRM Entities
- `companies`, `people`, `deals`, `tasks`, `interactions`
- All include `org_id` for tenant isolation

### Communication
- `emails`, `sms`, `calls` - Communication records
- `phones` - Twilio number mapping to orgs

### Integration Layer
- `integrations` - OAuth tokens, settings
- `api_keys` - API authentication
- `webhooks` - Outbound webhook configs
- `webhook_deliveries` - Delivery tracking
- `domain_events` - Event sourcing

### Lead-Gen (Phase 1b+)
- `leads` - Lead records with UTM tracking
- `fulfillment_partners` - Partner entities
- `lead_deliveries` - Lead routing history

## Security Architecture

### Row Level Security (RLS)
Every table with `org_id` has RLS policies:
```sql
-- Users can only access data from orgs they're members of
CREATE POLICY table_select ON table_name
  FOR SELECT USING (is_member_of(org_id));
```

### API Authentication
- API keys stored as hashes (HMAC)
- Webhook signatures validated (HMAC SHA-256)
- OAuth tokens encrypted at rest

### Data Isolation
- All queries filtered by `org_id`
- RLS policies enforce tenant boundaries
- No cross-org data leakage possible

## Integration Points

### Gmail
- OAuth 2.0 flow for authentication
- Encrypted refresh token storage
- Polling-based sync (Phase 1)
- Send via Gmail API

### Twilio
- Webhook signature validation
- Number-to-org mapping via `phones` table
- Inbound/outbound SMS and calls
- Recording URL storage

## Event System

### Domain Events
Events are emitted for:
- Entity CRUD operations
- Integration events
- Communication events

### Webhook Delivery
- Async processing via Edge Functions
- Retry with exponential backoff
- Dead letter queue for failures
- Delivery tracking in `webhook_deliveries`

## Scalability Considerations

- **Database:** Partitioned by `org_id`, indexed on hot fields
- **API:** Rate limiting (60 req/min per key)
- **Webhooks:** Async processing, queue-based
- **Caching:** Consider Redis for hot data (future)

## Observability

- Request ID correlation across services
- Structured logging with event IDs
- Integration SID tracking (Twilio, Gmail)
- Performance monitoring (p95 < 400ms target)

