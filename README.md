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
├── docs/                     # Comprehensive documentation
│   ├── README.md             # Documentation index
│   ├── ARCHITECTURE.md       # System architecture
│   ├── API.md                # API documentation
│   ├── DATABASE.md           # Database schema reference
│   ├── DEVELOPMENT.md        # Development setup guide
│   ├── ENVIRONMENT.md        # Environment variables
│   ├── INTEGRATIONS.md        # Integration setup guides
│   ├── TESTING.md            # Testing guide
│   ├── SECURITY.md           # Security guidelines
│   └── SUPABASE_NEW_KEYS.md  # Supabase new API keys guide
├── supabase/                 # Supabase configuration
│   ├── config.toml          # Supabase local config
│   └── migrations/          # Database migrations
├── apps/web/                # Next.js application
│   └── .env.local           # Environment variables (create from .env.example)
└── SETUP_REMOTE_SUPABASE.md  # Remote Supabase setup guide
└── [future implementation files]
```

## Documentation

### Core Documents
- **[PRD.md](./PRD.md)** - Complete Product Requirements Document for WorkOS v1.0
- **[PHASE1-BUILD-PLAN.md](./PHASE1-BUILD-PLAN.md)** - Detailed build plan for Phase 1 (CRM + Prospecting)
- **[CODE-STUBS.md](./CODE-STUBS.md)** - Code implementation examples for key integrations

### Comprehensive Guides
- **[Documentation Index](./docs/README.md)** - Start here for all documentation
- **[Development Setup](./docs/DEVELOPMENT.md)** - Complete development environment setup
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and design
- **[API Reference](./docs/API.md)** - REST API endpoints and webhooks
- **[Database Schema](./docs/DATABASE.md)** - Complete database schema with RLS
- **[Integration Guides](./docs/INTEGRATIONS.md)** - Gmail and Twilio setup
- **[Testing Guide](./docs/TESTING.md)** - Unit, integration, and E2E testing
- **[Security Guidelines](./docs/SECURITY.md)** - Security best practices
- **[Supabase New Keys](./docs/SUPABASE_NEW_KEYS.md)** - Migration guide for new API keys

### Setup Guides
- **[Remote Supabase Setup](./SETUP_REMOTE_SUPABASE.md)** - Connect to hosted Supabase

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

1. **Read the PRD:** Start with [PRD.md](./PRD.md) to understand the product vision
2. **Review Build Plan:** See [PHASE1-BUILD-PLAN.md](./PHASE1-BUILD-PLAN.md) for implementation details
3. **Setup Supabase:** Follow [SETUP_REMOTE_SUPABASE.md](./SETUP_REMOTE_SUPABASE.md) to connect to your Supabase project
4. **Setup Development:** Follow [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for local setup
5. **Explore Documentation:** Check [docs/README.md](./docs/README.md) for all available guides

### Quick Start

```bash
# Prerequisites
Node 20+, pnpm, Supabase CLI

# Install dependencies
pnpm install

# Link to remote Supabase (if not already done)
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push

# Setup environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase keys

# Start development server
pnpm dev
```

## Status

- ✅ Repository created and configured
- ✅ PRD documented
- ✅ Phase 1 build plan ready
- ✅ Comprehensive documentation created
- ✅ Next.js app structure initialized
- ✅ Supabase linked and migrations pushed
- ✅ Database schema with RLS policies deployed
- ✅ Supabase new API keys support integrated
- ✅ shadcn/ui components set up
- ✅ API routes implemented (People, Companies, Deals)
- ✅ Frontend pages created (Dashboard, People, Companies, Deals)
- ✅ Authentication structure in place
- 🚧 Gmail integration (pending)
- 🚧 Twilio integration (pending)
- 🚧 Domain events and webhooks (pending)

## License

[To be determined]

