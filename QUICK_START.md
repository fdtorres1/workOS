# Quick Start Guide

Get WorkOS running locally in 5 minutes.

## Prerequisites Check

```bash
# Check versions
node --version  # Should be 20+
pnpm --version  # Should be 8+
supabase --version  # Should be installed
```

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Create `apps/web/.env.local` with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vfwwhsguxixpjqfzhurz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxx
```

Get your keys from: https://app.supabase.com/project/vfwwhsguxixpjqfzhurz/settings/api

### 3. Verify Database

```bash
# Check if linked
supabase status --linked

# If not linked, link your project
supabase link --project-ref vfwwhsguxixpjqfzhurz

# Verify migrations are applied
supabase db push
```

### 4. Start Development Server

```bash
pnpm dev
```

### 5. Open Browser

Visit http://localhost:3000

You should see:
- Login page (if not authenticated)
- Dashboard (if authenticated)

## First Steps

1. **Create an account** via Supabase Auth
2. **Create an organization** (or use existing)
3. **Add yourself as org member** (via Supabase dashboard or API)
4. **Start using the app!**

## Troubleshooting

### Port 3000 already in use

```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Environment variables not loading

- Make sure `.env.local` is in `apps/web/` directory
- Restart the dev server after changing env vars
- Check variable names match exactly

### Database connection errors

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Verify RLS policies are applied

### Authentication issues

- Make sure Supabase Auth is enabled
- Check redirect URLs in Supabase settings
- Verify user exists in `auth.users` table

## Next Steps

- Read [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed setup
- Check [API.md](./docs/API.md) for API documentation
- Review [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design

