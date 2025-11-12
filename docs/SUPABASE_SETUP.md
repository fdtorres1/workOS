# Supabase Setup Guide

## Finding Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. You'll find:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Linking to Remote Supabase

### Option 1: Using Supabase CLI (Recommended)

```bash
# Link to your remote project
supabase link --project-ref <your-project-ref>

# Your project ref is in the URL: https://app.supabase.com/project/<project-ref>
# Or find it in Settings → General → Reference ID
```

### Option 2: Manual Configuration

Update your `.env.local` file with the credentials directly.

## Pushing Migrations

After linking, push your migrations:

```bash
# Push all migrations to remote
supabase db push

# Or reset and apply all migrations
supabase db reset --linked
```

## Environment Variables

Create/update `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Verifying Connection

Test the connection:

```bash
# Check connection status
supabase status

# Or test from Next.js app
pnpm dev
```

