# WorkOS

Modular, multi‑tenant WorkOS where each module is independently sellable, yet all share a single relational core.

## Overview

WorkOS is a comprehensive CRM platform with integrated Lead-Gen, Projects, Knowledge Base, and Voice Router modules. Built with Next.js, TypeScript, Supabase, and modern integrations.

## Repository Structure

```
/workOS
├── PRD.md                    # Product Requirements Document (v1.0)
├── PHASE1-BUILD-PLAN.md      # Detailed Phase 1 build plan
├── CODE-STUBS.md             # Implementation code examples
├── README.md                 # This file
└── [future implementation files]
```

## Documentation

- **[PRD.md](./PRD.md)** - Complete Product Requirements Document for WorkOS v1.0
- **[PHASE1-BUILD-PLAN.md](./PHASE1-BUILD-PLAN.md)** - Detailed build plan for Phase 1 (CRM + Prospecting)
- **[CODE-STUBS.md](./CODE-STUBS.md)** - Code implementation examples for key integrations

## Project Management

Track progress in [GitHub Project: WorkOS v1.0](https://github.com/users/fdtorres1/projects/3)

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **Integrations:** Google Gmail API, Twilio Voice & Messaging
- **Deployment:** Vercel (web) + Supabase (DB/Functions)

## Phase 1 Scope

**CRM Core:**
- Contacts, Companies, Deals, Tasks
- Activity timeline (emails/calls/SMS/notes)
- Gmail send/sync
- Twilio SMS/calls
- CSV import/export
- Pipelines & saved views
- Basic automations
- API + Webhooks

**Lead-Gen Wedge (Phase 1b):**
- Lead intake endpoints
- UTM capture
- Minimal routing
- Attribution fields
- Partner entity groundwork

## Getting Started

See [PHASE1-BUILD-PLAN.md](./PHASE1-BUILD-PLAN.md) for complete setup instructions.

### Quick Start

```bash
# Prerequisites
Node 20+, pnpm, Supabase CLI

# Scaffold
pnpm create next-app@latest web --ts --eslint --tailwind --app
cd web
pnpm add @supabase/supabase-js zod react-hook-form class-variance-authority lucide-react twilio googleapis
pnpm dlx shadcn@latest init

# Supabase
npx supabase init
npx supabase db push
```

## Status

- ✅ Repository created
- ✅ PRD documented
- ✅ Phase 1 build plan ready
- 🚧 Implementation in progress

## License

[To be determined]

