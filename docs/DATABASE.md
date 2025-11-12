# Database Schema Reference

## Overview

WorkOS uses PostgreSQL with Supabase, leveraging Row Level Security (RLS) for multi-tenant isolation.

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
-- Optional: CREATE EXTENSION IF NOT EXISTS "vector";  -- For AI features
```

## Core Tables

### Organizations

```sql
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);
```

### CRM Tables

#### Companies

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  tags TEXT[] DEFAULT '{}',
  owner_id UUID REFERENCES org_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_companies_org_name ON companies(org_id, name);
CREATE INDEX idx_companies_org_owner ON companies(org_id, owner_id);
```

#### People

```sql
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,
  linkedin_url TEXT,
  tags TEXT[] DEFAULT '{}',
  owner_id UUID REFERENCES org_members(id) ON DELETE SET NULL,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_people_org_email ON people(org_id, email);
CREATE INDEX idx_people_org_company ON people(org_id, company_id);
CREATE INDEX idx_people_org_owner ON people(org_id, owner_id);
```

#### Pipelines & Stages

```sql
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deal_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stages_pipeline ON deal_stages(pipeline_id, position);
```

#### Deals

```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES deal_stages(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  value_cents BIGINT,
  currency TEXT DEFAULT 'USD',
  owner_id UUID REFERENCES org_members(id) ON DELETE SET NULL,
  expected_close_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_deals_org_pipeline ON deals(org_id, pipeline_id, stage_id, status);
CREATE INDEX idx_deals_org_owner ON deals(org_id, owner_id);
```

#### Tasks

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  owner_id UUID REFERENCES org_members(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_org_status ON tasks(org_id, status, due_at);
CREATE INDEX idx_tasks_org_owner ON tasks(org_id, owner_id);
```

#### Interactions

```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'email', 'sms', 'call', 'meeting', 'system')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_org_occurred ON interactions(org_id, occurred_at DESC);
CREATE INDEX idx_interactions_person ON interactions(person_id, occurred_at DESC);
CREATE INDEX idx_interactions_company ON interactions(company_id, occurred_at DESC);
```

### Communication Tables

#### Emails

```sql
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  subject TEXT,
  snippet TEXT,
  body_html TEXT,
  from_address TEXT NOT NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[] DEFAULT '{}',
  bcc_addresses TEXT[] DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'sent',
  created_by UUID REFERENCES org_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emails_org_sent ON emails(org_id, sent_at DESC);
CREATE INDEX idx_emails_thread ON emails(gmail_thread_id);
```

#### SMS

```sql
CREATE TABLE sms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  twilio_sid TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT,
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sms_org_sent ON sms(org_id, sent_at DESC);
CREATE INDEX idx_sms_twilio_sid ON sms(twilio_sid);
```

#### Calls

```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  twilio_sid TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  duration_seconds INTEGER,
  recording_url TEXT,
  status TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calls_org_started ON calls(org_id, started_at DESC);
CREATE INDEX idx_calls_twilio_sid ON calls(twilio_sid);
```

### Integration Tables

#### Integrations

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'twilio', 'stripe', 'ads', 'gbp')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integrations_org_provider ON integrations(org_id, provider);
```

#### API Keys

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hashed_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_org ON api_keys(org_id);
CREATE INDEX idx_api_keys_hash ON api_keys(hashed_key);
```

#### Webhooks

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_id UUID,
  attempt INTEGER NOT NULL DEFAULT 1,
  status INTEGER,
  response_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_attempt_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_attempt_at) WHERE next_attempt_at IS NOT NULL;
```

#### Domain Events

```sql
CREATE TABLE domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domain_events_org_type ON domain_events(org_id, type, occurred_at DESC);
CREATE INDEX idx_domain_events_entity ON domain_events(entity, entity_id);
```

### Phone Numbers

```sql
CREATE TABLE phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  label TEXT,
  e164 TEXT UNIQUE NOT NULL,
  features TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_phones_e164 ON phones(e164);
CREATE INDEX idx_phones_org ON phones(org_id);
```

### Lead-Gen Tables (Phase 1b+)

#### Leads

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  source TEXT,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'routed', 'won', 'lost')),
  owner_id UUID REFERENCES org_members(id) ON DELETE SET NULL,
  utm JSONB DEFAULT '{}'::jsonb,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_org_created ON leads(org_id, created_at DESC, status);
```

#### Fulfillment Partners (Phase 2)

```sql
CREATE TABLE fulfillment_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lead_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES fulfillment_partners(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'rejected', 'expired')),
  delivered_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

## Row Level Security (RLS)

### Helper Function

```sql
CREATE OR REPLACE FUNCTION is_member_of(org UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM org_members 
    WHERE org_id = org 
    AND user_id = auth.uid()
  )
$$;
```

### Example RLS Policies

```sql
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY companies_select ON companies
  FOR SELECT
  USING (is_member_of(org_id));

-- Write policy (INSERT, UPDATE, DELETE)
CREATE POLICY companies_write ON companies
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));
```

Apply similar policies to all tables with `org_id`.

## Helper Functions

### Resolve Org by Twilio Number

```sql
CREATE OR REPLACE FUNCTION resolve_org_by_twilio_number(phone_in TEXT)
RETURNS TABLE(org_id UUID)
LANGUAGE SQL
STABLE
AS $$
  SELECT p.org_id
  FROM phones p
  WHERE p.e164 = phone_in
  LIMIT 1
$$;
```

### Resolve Person by Phone

```sql
CREATE OR REPLACE FUNCTION resolve_person_by_phone(org_in UUID, phone_in TEXT)
RETURNS TABLE(id UUID)
LANGUAGE SQL
STABLE
AS $$
  SELECT p.id
  FROM people p
  WHERE p.org_id = org_in
  AND p.phone = phone_in
  AND p.deleted_at IS NULL
  LIMIT 1
$$;
```

## Relationships

```
orgs (1) ──< (many) org_members
orgs (1) ──< (many) companies
orgs (1) ──< (many) people
orgs (1) ──< (many) deals
orgs (1) ──< (many) tasks
orgs (1) ──< (many) interactions

companies (1) ──< (many) people
companies (1) ──< (many) deals

people (1) ──< (many) deals
people (1) ──< (many) tasks
people (1) ──< (many) interactions

pipelines (1) ──< (many) deal_stages
deal_stages (1) ──< (many) deals

webhooks (1) ──< (many) webhook_deliveries
```

