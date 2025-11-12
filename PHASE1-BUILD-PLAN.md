# Phase 1 — CRM + Prospecting (Cursor‑ready Build Plan)

**Status:** Ready to Build  
**Last updated:** Nov 12, 2025

This extends what we drafted earlier and incorporates the "Lead‑Gen wedge" scaffolding and governance.

## A. Repo & Tech

- **Next.js** (App Router) + TypeScript + Tailwind + shadcn/ui
- **Supabase** (Postgres, Auth, RLS, Edge Functions)
- **Integrations:** Google Gmail API, Twilio Voice & Messaging
- **Optional:** pgvector (disabled by default), Meilisearch later
- **Deployment:** Vercel (web) + Supabase (DB/Functions)

### Structure

```
/apps/web
  /app
  /app/api                     # Gmail/Twilio/webhooks/oauth
  /components
  /lib
  /modules/{crm,prospecting,comms}
  /types
/packages
  /design (optional)
/supabase
  /migrations
  /functions (edge)
/docs
```

## B. Database (Phase 1 schema + scaffolding for Lead‑Gen)

**Extensions:** `pgcrypto`, `pg_trgm` (search), (optional) `vector`.

### Multi‑tenant core

```sql
create table orgs (...);
create table org_members (... role in ('owner','admin','member'));
```

### CRM

```sql
create table companies (
  ... org_id, name, website, phone, location fields, tags[], 
  owner_id, timestamps, deleted_at
);

create table people (
  ... org_id, company_id, first_name, last_name, email, phone, 
  title, linkedin_url, tags[], owner_id, last_contacted_at, 
  timestamps, deleted_at
);

create table pipelines (... org_id, name);
create table deal_stages (... org_id, pipeline_id, name, position);
create table deals (
  ... org_id, pipeline_id, stage_id, company_id, person_id, 
  name, value_cents, currency, owner_id, expected_close_date, 
  status, timestamps
);

create table tasks (
  ... org_id, title, due_at, status, priority, owner_id, 
  company_id, person_id, deal_id, created_at, completed_at
);

create table interactions (
  ... org_id, type in ('note','email','sms','call','meeting','system'),
  occurred_at, summary, company_id, person_id, deal_id, metadata jsonb
);
```

### Comms

```sql
create table emails (
  ... direction, gmail_message_id, gmail_thread_id, subject, snippet, 
  body_html, from_address, to_addresses text[], cc_addresses text[], 
  bcc_addresses text[], sent_at, status, created_by
);

create table sms (
  ... direction, twilio_sid, from_number, to_number, body, 
  status, sent_at
);

create table calls (
  ... direction, twilio_sid, from_number, to_number, duration_seconds, 
  recording_url, status, started_at, ended_at
);
```

### Integrations, API keys, webhooks

```sql
create table integrations (
  ... org_id, provider in ('gmail','twilio','stripe','ads','gbp'), 
  status, settings jsonb
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  hashed_key text not null, -- store hash only
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table webhooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  url text not null,
  secret text not null,
  event_types text[] not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid references webhooks(id) on delete cascade,
  event_id uuid,
  attempt int not null default 1,
  status int,
  response_ms int,
  error text,
  created_at timestamptz not null default now(),
  next_attempt_at timestamptz
);

create table domain_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  type text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb not null,
  occurred_at timestamptz not null default now()
);
```

### Phones (maps Twilio numbers to org, used for inbound)

```sql
create table phones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  label text,
  e164 text unique not null,           -- "+15551234567"
  features text[] default '{}'::text[],-- ['sms','voice','router']
  created_at timestamptz not null default now()
);
```

### Lead‑Gen scaffolding (Phase 1b)

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  source text,                         -- 'web_form','twilio_call','sms','ad_webhook','gbp'
  person_id uuid references people(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  status text not null default 'new' check (status in ('new','qualified','routed','won','lost')),
  owner_id uuid,
  utm jsonb default '{}'::jsonb,       -- {source,medium,campaign,term,content}
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Placeholder partner tables for Phase 2:
create table fulfillment_partners (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  contact_email text,
  contact_phone text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table lead_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  partner_id uuid not null references fulfillment_partners(id) on delete cascade,
  status text not null default 'sent' check (status in ('sent','accepted','rejected','expired')),
  delivered_at timestamptz,
  responded_at timestamptz,
  metadata jsonb default '{}'::jsonb
);
```

### Indexes (examples)

```sql
create index on people (org_id, email);
create index on companies (org_id, name);
create index on deals (org_id, pipeline_id, stage_id, status);
create index on interactions (org_id, occurred_at desc);
create index on emails (org_id, sent_at desc);
create index on leads (org_id, created_at desc, status);
create index on phones (e164);
```

## C. RLS (essentials)

Enable RLS on all tables with `org_id` and add policies:

```sql
create or replace function is_member_of(org uuid)
returns boolean language sql stable as $$
  select exists(select 1 from org_members where org_id = org and user_id = auth.uid())
$$;

-- Example for companies (repeat for others)
alter table companies enable row level security;
create policy companies_select on companies
  for select using (is_member_of(org_id));
create policy companies_write on companies
  for all using (is_member_of(org_id)) with check (is_member_of(org_id));
```

Org admin/owner deletes → add an extra check on role from `org_members`.

## D. Integrations

### Gmail

- **Scopes:** `gmail.send`, `gmail.readonly`, `gmail.modify` (if labeling).
- **Flow:** OAuth in Settings → store encrypted refresh token via Edge Function (never exposed via PostgREST).
- **Sync:** Poll threads for known contacts (newer_than:7–14d); store messages in `emails`; also `interactions` entry.
- **Send:** Compose drawer → Gmail API → persist `emails` + `interactions`.

### Twilio (Voice & SMS)

- **Outbound SMS:** route `/api/sms/send` (TypeScript stub provided earlier).
- **Inbound SMS:** webhook `/api/webhooks/twilio/sms` (signature validated) → map "To" number via `phones` to `org_id`; "From" to `person`; write `sms` + `interactions`.
- **Outbound Calls:** click‑to‑call (TwiML or JS Client).
- **Inbound Calls:** `/api/webhooks/twilio/voice` → TwiML (greeting, record, branch) → write `calls`.
- **Recordings:** store Twilio `recording_url`; transcription provider interface is modular (Phase 2).

## E. API, Webhooks, Events

### API Keys

Create, revoke in Settings → API. Store only hash of key; show raw once on creation.

### Outbound Webhooks

Settings → Webhooks: URL + Secret + Event types; deliver with `X-Signature` (HMAC SHA‑256). Retries with exponential backoff; DLQ visible in UI.

**Events emitted (Phase 1):** `person.*`, `company.*`, `deal.*`, `task.*`, `email.*`, `sms.*`, `call.*`, `lead.created`, `integration.*`.

## F. Frontend (Phase 1 pages)

- `/dashboard` KPIs: new contacts/leads, activities today, deals by stage.
- `/people`, `/companies`, `/deals` (Kanban), `/tasks`.
- **Details:** `/people/[id]`, `/companies/[id]`, `/deals/[id]` with timeline.
- `/settings/integrations` (Gmail/Twilio), `/settings/api` (API Keys, Webhooks), `/settings/numbers` (Phones).

**UX invariants:** Global search; inline edit; compose drawers; saved views; bulk actions; toasts + optimistic updates.

## G. Acceptance Criteria (Phase 1)

- A user in Org A cannot read/update Org B data (RLS test).
- Send email from Person view → appears in timeline within 2s; Gmail thread id stored.
- Inbound SMS to Twilio number → timeline item created; correct org/person.
- Drag Deal to new stage → stage updates; `deal.moved` event emitted; Kanban reflects instantly.
- CSV import: 500‑row file completes < 20s with mapping step.
- Outbound webhooks receive signed payloads and succeed for at least one subscriber.

## H. DevOps & Setup

### Prereqs

Node 20+, pnpm, Supabase CLI, Twilio account + number(s), Google Cloud OAuth creds.

### Scaffold

```bash
pnpm create next-app@latest web --ts --eslint --tailwind --app
cd web
pnpm add @supabase/supabase-js zod react-hook-form class-variance-authority lucide-react twilio googleapis
pnpm dlx shadcn@latest init

# Supabase
npx supabase init
# Add SQL in /supabase/migrations then:
npx supabase db push
```

### Env

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://yourapp.com/api/oauth/google/callback
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=...
PUBLIC_TWILIO_SMS_WEBHOOK_URL=https://yourapp.com/api/webhooks/twilio/sms
```

### Observability

Attach `x-request-id` to all responses; log with event ids and integration sids.

Nightly backup; weekly restore test; `pg_stat_statements` enabled.

## I. Testing

- **Unit:** Zod schemas, utilities.
- **Integration:** Gmail/Twilio route handlers with mocks; RLS policy tests.
- **E2E (Playwright):** create org → add company/person → send SMS/email (mock) → move deal → see timeline.
- **Load test (k6):** 50 rps on key endpoints; p95 < 400ms.

## J. Rollout

Internal dogfood (your org) → invite one partner → collect feedback → enable API keys/webhooks for them → progress to Lead‑Gen Phase 1b.

## (Appendix) Minimal code stubs

You already have working examples for SMS send, Twilio inbound SMS, and Gmail send in our prior message. Reuse those exactly as written. For webhooks (outbound), use a simple Edge Function that dequeues from `domain_events` and posts signed payloads; store delivery attempts in `webhook_deliveries`.

### Code Stubs

See `CODE-STUBS.md` for complete implementation examples:
- `/app/api/sms/send/route.ts`
- `/app/api/webhooks/twilio/sms/route.ts`
- `/app/api/email/send/route.ts`

