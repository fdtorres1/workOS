# Development Setup Guide

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** 8+ (package manager)
- **Supabase CLI** (for local development)
- **Git** (version control)
- **VS Code** or **Cursor** (recommended IDE)

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/fdtorres1/workOS.git
cd workOS
```

### 2. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Supabase Setup

#### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

#### Login to Supabase

```bash
supabase login
```

#### Initialize Supabase (if not already done)

```bash
npx supabase init
```

#### Start Local Supabase

```bash
supabase start
```

This will:
- Start local PostgreSQL database
- Start local Supabase Studio (http://localhost:54323)
- Generate local environment variables

#### Link to Remote Project (for production)

```bash
supabase link --project-ref <your-project-ref>
```

### 4. Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start>

# Google OAuth (Gmail)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
GMAIL_TOKEN_ENDPOINT=<edge-function-url>/gmail-token
INTERNAL_API_KEY=<secure-api-key>

# Twilio
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_MESSAGING_SERVICE_SID=<your-messaging-service-sid>
PUBLIC_TWILIO_SMS_WEBHOOK_URL=http://localhost:3000/api/webhooks/twilio/sms
PUBLIC_TWILIO_VOICE_WEBHOOK_URL=http://localhost:3000/api/webhooks/twilio/voice

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Database Migrations

#### Run Migrations Locally

```bash
# Apply all migrations
supabase db reset

# Or apply specific migration
supabase migration up
```

#### Create New Migration

```bash
supabase migration new <migration_name>
```

Edit the generated file in `supabase/migrations/`.

### 6. Install shadcn/ui Components

```bash
pnpm dlx shadcn@latest init
```

Follow the prompts to configure:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes

### 7. Start Development Server

```bash
# From project root
pnpm dev

# Or from apps/web directory
cd apps/web
pnpm dev
```

Visit http://localhost:3000

**Note:** Make sure you have:
- ✅ `.env.local` file in `apps/web/` with Supabase credentials
- ✅ Supabase project linked (`supabase link --project-ref <ref>`)
- ✅ Migrations pushed (`supabase db push`)

## Project Structure

```
workOS/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages
│       │   ├── api/            # API routes
│       │   │   ├── auth/       # Authentication routes
│       │   │   ├── people/     # People CRUD
│       │   │   ├── companies/  # Companies CRUD
│       │   │   └── deals/      # Deals CRUD
│       │   ├── auth/           # Auth callback pages
│       │   └── (dashboard)/    # Dashboard pages with sidebar
│       │       ├── dashboard/  # Dashboard page
│       │       ├── people/     # People list/detail
│       │       ├── companies/  # Companies list
│       │       └── deals/      # Deals Kanban
│       ├── components/         # React components
│       │   ├── ui/             # shadcn/ui components
│       │   │   ├── date-picker.tsx    # Date picker component
│       │   │   ├── phone-input.tsx    # Phone input with country selector
│       │   │   └── company-select.tsx  # Searchable company selector
│       │   └── layout/         # Layout components (Sidebar, AppLayout)
│       ├── lib/                # Utilities, helpers
│       │   ├── supabase/       # Supabase client (client, server, admin)
│       │   ├── api/            # API helpers (auth, errors)
│       │   └── utils/          # Shared utilities
│       ├── modules/            # Feature modules
│       │   ├── crm/           # CRM functionality
│       │   ├── prospecting/   # Lead generation
│       │   └── comms/         # Communications
│       └── types/              # TypeScript types
├── supabase/
│   ├── migrations/            # Database migrations
│   ├── functions/             # Edge Functions
│   └── config.toml           # Supabase config
├── docs/                      # Documentation
└── README.md
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write code following TypeScript best practices
- Add tests for new functionality
- Update documentation as needed

### 3. Test Locally

```bash
# Run type checking
pnpm type-check

# Run linter
pnpm lint

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

### 4. Database Changes

If you need to modify the database:

```bash
# Create migration
supabase migration new add_new_table

# Edit migration file
# Then test locally
supabase db reset

# Apply to remote (after review)
supabase db push
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a Pull Request on GitHub.

## Code Style

### TypeScript

- Use strict mode
- Prefer interfaces for object shapes
- Use type aliases for unions/primitives
- Avoid `any`, use `unknown` when needed

### React

- Use functional components
- Prefer hooks over class components
- Use `use client` directive for client components
- Keep components small and focused

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE.ts`
- Types: `types.ts` or `*.types.ts`

## Testing

### Unit Tests

```bash
pnpm test
```

Tests are in `__tests__/` directories or `*.test.ts` files.

### Integration Tests

Test API routes and database operations:

```bash
pnpm test:integration
```

### E2E Tests

Using Playwright:

```bash
pnpm test:e2e
```

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Supabase Logs

```bash
# View Supabase logs
supabase logs

# View specific service logs
supabase logs --type functions
```

## Common Tasks

### Add New API Route

1. Create file in `app/api/your-route/route.ts`
2. Export `GET`, `POST`, `PATCH`, `DELETE` handlers
3. Add authentication/authorization
4. Add validation with Zod
5. Add error handling

### Add New Database Table

1. Create migration: `supabase migration new add_table_name`
2. Write SQL in migration file
3. Add RLS policies
4. Test locally: `supabase db reset`
5. Update types if needed

### Add New Integration

1. Add provider to `integrations` table enum
2. Create OAuth flow (if needed)
3. Add API routes for webhooks
4. Store credentials securely
5. Add to Settings UI

## Troubleshooting

### Supabase Won't Start

```bash
# Stop all containers
supabase stop

# Reset and start
supabase db reset
supabase start
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

- Check `.env.local` has correct Supabase URL
- Verify Supabase is running: `supabase status`
- Check network connectivity

### Type Errors

```bash
# Regenerate types from database
supabase gen types typescript --local > apps/web/types/database.types.ts
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

