# Supabase New API Keys Migration Guide

## Overview

Supabase has introduced new API keys to replace the legacy `anon` and `service_role` keys:
- **Publishable Key** (`sb_publishable_...`) - Replaces `anon` key
- **Secret Key** (`sb_secret_...`) - Replaces `service_role` key

## Why the Change?

- Better security and key management
- Clearer naming (publishable vs secret)
- Enhanced developer experience
- Future-proof authentication system

## Migration Status

✅ **WorkOS is updated to support both new and legacy keys**

The code automatically detects and uses:
1. New keys if available (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`)
2. Falls back to legacy keys if new ones aren't set (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

## Getting Your New Keys

1. Go to your Supabase project: https://app.supabase.com/project/vfwwhsguxixpjqfzhurz/settings/api
2. Look for the new API keys section
3. Copy:
   - **Publishable key** (starts with `sb_publishable_...`)
   - **Secret key** (starts with `sb_secret_...`)

## Updating Your Environment

Update `apps/web/.env.local`:

```bash
# New keys (recommended)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxx

# Legacy keys (still work, but deprecated)
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Code Changes

The following files have been updated to support both key types:

- `lib/supabase/client.ts` - Client-side Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client  
- `lib/supabase/admin.ts` - Admin client (bypasses RLS)

All clients check for new keys first, then fall back to legacy keys for backward compatibility.

## Security Notes

- **Publishable Key**: Safe to expose in client-side code (browser, mobile apps)
- **Secret Key**: ⚠️ **NEVER** expose to client. Only use in:
  - Server-side API routes
  - Edge Functions
  - Background jobs
  - Admin operations

## Timeline

- **Current**: Both new and legacy keys supported
- **Future**: Supabase will deprecate legacy keys (expected Nov 2025)
- **Recommendation**: Migrate to new keys now

## Testing

After updating your keys:

```bash
# Test the connection
pnpm dev

# Verify in browser console (should connect successfully)
# Check Supabase dashboard for activity
```

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Make sure you've set either new keys OR legacy keys
- Check that keys start with correct prefix (`sb_publishable_` or `sb_secret_`)

**Authentication not working**
- Verify keys are copied correctly (no extra spaces)
- Check that publishable key is used for client-side code
- Ensure secret key is only in server-side code

## References

- [Supabase API Key Migration Discussion](https://github.com/orgs/supabase/discussions/29260)
- [Supabase Documentation](https://supabase.com/docs)

