# Environment Variables Reference

## Overview

This document lists all environment variables used in WorkOS, organized by category.

## Required Variables

### Supabase

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (new, client-safe) | `sb_publishable_...` | Yes* |
| `SUPABASE_SECRET_KEY` | Supabase secret key (new, server-only) | `sb_secret_...` | Yes* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy anon key (backward compatibility) | `eyJhbGc...` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy service role key (backward compatibility) | `eyJhbGc...` | No |

*Either use new keys (recommended) or legacy keys. The code supports both.

**Security Note:** Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code. It bypasses RLS.

### Google OAuth (Gmail)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-xxx` | Yes |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `https://app.com/api/oauth/google/callback` | Yes |
| `GMAIL_TOKEN_ENDPOINT` | Edge Function URL for token retrieval | `https://xxx.functions.supabase.co/gmail-token` | Yes |
| `INTERNAL_API_KEY` | API key for internal Edge Function calls | `secure-random-key` | Yes |

### Twilio

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `ACxxxxxxxxxxxxx` | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | `your-auth-token` | Yes |
| `TWILIO_MESSAGING_SERVICE_SID` | Messaging service SID (optional) | `MGxxxxxxxxxxxxx` | No |
| `PUBLIC_TWILIO_SMS_WEBHOOK_URL` | SMS webhook URL | `https://app.com/api/webhooks/twilio/sms` | Yes |
| `PUBLIC_TWILIO_VOICE_WEBHOOK_URL` | Voice webhook URL | `https://app.com/api/webhooks/twilio/voice` | Yes |

## Optional Variables

### Application

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://app.workos.com` | `http://localhost:3000` |
| `NODE_ENV` | Environment | `production`, `development` | `development` |
| `PORT` | Server port (local dev) | `3000` | `3000` |

### Feature Flags

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_ENABLE_AI` | Enable AI features | `true`, `false` | `false` |
| `NEXT_PUBLIC_ENABLE_VECTOR` | Enable vector search | `true`, `false` | `false` |

### Observability

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `SENTRY_DSN` | Sentry DSN for error tracking | `https://xxx@sentry.io/xxx` | - |
| `LOG_LEVEL` | Logging level | `debug`, `info`, `warn`, `error` | `info` |

## Environment-Specific Configs

### Development (`.env.local`)

```bash
# Supabase (local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start>

# Google OAuth (use localhost redirect)
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# Twilio (use ngrok for webhooks in dev)
PUBLIC_TWILIO_SMS_WEBHOOK_URL=https://xxx.ngrok.io/api/webhooks/twilio/sms

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Staging (`.env.staging`)

```bash
# Use staging Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://xxx-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-key>

# Staging app URL
NEXT_PUBLIC_APP_URL=https://staging.workos.com
NODE_ENV=production
```

### Production (`.env.production`)

```bash
# Production Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-key>
SUPABASE_SERVICE_ROLE_KEY=<production-key>

# Production app URL
NEXT_PUBLIC_APP_URL=https://app.workos.com
NODE_ENV=production
```

## Security Best Practices

### 1. Never Commit Secrets

- Add `.env.local` to `.gitignore`
- Use `.env.example` for documentation
- Store secrets in:
  - Vercel Environment Variables (production)
  - Supabase Secrets (Edge Functions)
  - Secure vault (team access)

### 2. Use Different Credentials Per Environment

- Separate Google OAuth apps for dev/staging/prod
- Different Twilio accounts or sub-accounts
- Isolated Supabase projects

### 3. Rotate Keys Regularly

- API keys: Every 90 days
- OAuth secrets: When compromised
- Database passwords: Annually

### 4. Limit Access

- Only expose `NEXT_PUBLIC_*` variables to client
- Keep service role keys server-only
- Use least privilege for API keys

## Setting Up Environment Variables

### Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in values from your service accounts
3. Never commit `.env.local`

### Vercel Deployment

1. Go to Project Settings → Environment Variables
2. Add each variable for appropriate environments
3. Redeploy after adding new variables

### Supabase Edge Functions

```bash
# Set secret
supabase secrets set INTERNAL_API_KEY=your-key

# List secrets
supabase secrets list
```

## Validation

Create `lib/env.ts` to validate environment variables:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

Use in your code:

```typescript
import { env } from '@/lib/env';

// Type-safe access
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
```

## Troubleshooting

### Missing Variables

If you see errors about missing environment variables:

1. Check `.env.local` exists
2. Verify variable names match exactly
3. Restart dev server after adding variables
4. Check for typos in variable names

### Client vs Server Variables

- `NEXT_PUBLIC_*` variables are exposed to the browser
- Other variables are server-only
- Never put secrets in `NEXT_PUBLIC_*` variables

### Variable Not Updating

- Restart dev server: `pnpm dev`
- Clear Next.js cache: `rm -rf .next`
- Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

