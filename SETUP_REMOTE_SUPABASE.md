# Remote Supabase Setup - Quick Guide

## ✅ Completed Steps

1. ✅ Linked to remote Supabase project: `vfwwhsguxixpjqfzhurz`
2. ✅ Updated database version to 17
3. ✅ Pushed all migrations to remote database

## 📋 Next Steps: Get Your API Keys

1. Go to your Supabase project settings:
   **https://app.supabase.com/project/vfwwhsguxixpjqfzhurz/settings/api**

2. Copy the following values:
   - **Project URL** (under "Project URL" section)
   - **anon public key** (under "Project API keys" → "anon" → "public")
   - **service_role key** (under "Project API keys" → "service_role" → "secret") ⚠️ Keep this secret!

3. Create `apps/web/.env.local` file with:

```bash
# Supabase (Remote)
NEXT_PUBLIC_SUPABASE_URL=https://vfwwhsguxixpjqfzhurz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google OAuth (Gmail) - Add later
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
GMAIL_TOKEN_ENDPOINT=https://vfwwhsguxixpjqfzhurz.supabase.co/functions/v1/gmail-token
INTERNAL_API_KEY=

# Twilio - Add later
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
PUBLIC_TWILIO_SMS_WEBHOOK_URL=http://localhost:3000/api/webhooks/twilio/sms
PUBLIC_TWILIO_VOICE_WEBHOOK_URL=http://localhost:3000/api/webhooks/twilio/voice

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🧪 Verify Connection

After creating `.env.local`, test the connection:

```bash
cd apps/web
pnpm dev
```

Visit http://localhost:3000 - you should see the WorkOS homepage.

## 📊 Check Database

You can verify your database schema in Supabase Studio:
**https://app.supabase.com/project/vfwwhsguxixpjqfzhurz/editor**

You should see all the tables we created:
- `orgs`, `org_members`
- `companies`, `people`, `deals`, `tasks`
- `emails`, `sms`, `calls`
- `integrations`, `api_keys`, `webhooks`
- `leads`, `phones`
- etc.

## 🔒 Security Note

- Never commit `.env.local` to git (it's in `.gitignore`)
- The `service_role` key bypasses RLS - keep it secret!
- Only use `service_role` key in server-side code

