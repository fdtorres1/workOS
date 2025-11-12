# Integration Setup Guides

## Gmail Integration

### Prerequisites

1. Google Cloud Project
2. Gmail API enabled
3. OAuth 2.0 credentials

### Setup Steps

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **Gmail API**

#### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/oauth/google/callback`
   - Production: `https://yourdomain.com/api/oauth/google/callback`
5. Save **Client ID** and **Client Secret**

#### 3. Configure OAuth Scopes

Required scopes:
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.modify` (optional, for labeling)

#### 4. Environment Variables

Add to `.env.local`:

```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
```

#### 5. OAuth Flow Implementation

**Initiate OAuth:**

```typescript
// app/api/oauth/google/route.ts
import { google } from 'googleapis';

export async function GET(req: Request) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force consent to get refresh token
  });

  return Response.redirect(url);
}
```

**Handle Callback:**

```typescript
// app/api/oauth/google/callback/route.ts
export async function GET(req: Request) {
  const { code } = Object.fromEntries(new URL(req.url).searchParams);
  
  // Exchange code for tokens
  // Store refresh token securely (Edge Function)
  // Redirect to settings page
}
```

#### 6. Store Tokens Securely

**Never store tokens in the database directly.** Use Supabase Edge Function:

```typescript
// supabase/functions/gmail-token/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { orgId } = await req.json();
  
  // Encrypt and store refresh token
  // Return decrypted token when needed
});
```

#### 7. Send Email

See `CODE-STUBS.md` for complete implementation.

### Testing

1. Navigate to Settings → Integrations
2. Click "Connect Gmail"
3. Authorize in Google popup
4. Send test email from Person view
5. Verify email appears in timeline

## Twilio Integration

### Prerequisites

1. Twilio account
2. Phone number with SMS/Voice capabilities
3. Webhook URL (use ngrok for local dev)

### Setup Steps

#### 1. Create Twilio Account

1. Sign up at [twilio.com](https://www.twilio.com)
2. Verify phone number
3. Get Account SID and Auth Token from dashboard

#### 2. Purchase Phone Number

1. Go to **Phone Numbers** → **Buy a number**
2. Select capabilities:
   - ✅ SMS
   - ✅ Voice
3. Purchase number

#### 3. Configure Webhooks

**For Local Development (ngrok):**

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from ngrok.com

# Start tunnel
ngrok http 3000

# Use the HTTPS URL for webhooks:
# https://xxx.ngrok.io/api/webhooks/twilio/sms
```

**Configure in Twilio Console:**

1. Go to **Phone Numbers** → **Manage** → **Active numbers**
2. Click your number
3. Set webhooks:
   - **SMS:** `https://yourdomain.com/api/webhooks/twilio/sms`
   - **Voice:** `https://yourdomain.com/api/webhooks/twilio/voice`

#### 4. Environment Variables

Add to `.env.local`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
PUBLIC_TWILIO_SMS_WEBHOOK_URL=https://yourdomain.com/api/webhooks/twilio/sms
PUBLIC_TWILIO_VOICE_WEBHOOK_URL=https://yourdomain.com/api/webhooks/twilio/voice
```

#### 5. Register Phone Number in Database

After connecting Twilio, add phone number to `phones` table:

```sql
INSERT INTO phones (org_id, e164, label, features)
VALUES (
  'org-uuid',
  '+15551234567',
  'Main Business Line',
  ARRAY['sms', 'voice']
);
```

#### 6. Implement Webhooks

**SMS Webhook:**

See `CODE-STUBS.md` for complete implementation.

**Voice Webhook:**

```typescript
// app/api/webhooks/twilio/voice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get('From') as string;
  const to = formData.get('To') as string;
  
  // Validate signature
  // Resolve org/person
  // Create call record
  
  const response = new VoiceResponse();
  response.say('Hello, thank you for calling.');
  response.record({
    recordingStatusCallback: '/api/webhooks/twilio/recording',
    recordingStatusCallbackEvent: ['completed']
  });
  
  return new NextResponse(response.toString(), {
    headers: { 'Content-Type': 'text/xml' }
  });
}
```

### Testing

#### Test SMS

1. Send SMS from Twilio console to your number
2. Verify webhook receives request
3. Check `sms` and `interactions` tables
4. Verify timeline shows SMS

#### Test Outbound SMS

1. Go to Person view
2. Click "Send SMS"
3. Enter message
4. Verify SMS sent via Twilio
5. Check timeline updated

#### Test Voice

1. Call your Twilio number
2. Verify call record created
3. Check recording URL stored
4. Verify timeline shows call

## Webhook Security

### Validate Twilio Signatures

Always validate webhook signatures:

```typescript
import twilio from 'twilio';

const isValid = twilio.validateRequest(
  process.env.TWILIO_AUTH_TOKEN!,
  req.headers.get('x-twilio-signature')!,
  webhookUrl,
  params
);

if (!isValid) {
  return new Response('Invalid signature', { status: 403 });
}
```

### Validate Custom Webhooks

For outbound webhooks, use HMAC SHA-256:

```typescript
import crypto from 'crypto';

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// In webhook delivery
const signature = signPayload(JSON.stringify(payload), webhookSecret);
headers['X-Signature'] = `sha256=${signature}`;
```

## Troubleshooting

### Gmail Issues

**"Redirect URI mismatch"**
- Check redirect URI matches exactly in Google Console
- Verify `GOOGLE_REDIRECT_URI` matches

**"Invalid grant"**
- Refresh token may have expired
- Re-authenticate user
- Check token storage/encryption

**"Insufficient permissions"**
- Verify required scopes requested
- Check user granted permissions

### Twilio Issues

**Webhook not receiving requests**
- Verify webhook URL is publicly accessible
- Check ngrok is running (local dev)
- Verify URL in Twilio console matches

**"Invalid signature"**
- Check `TWILIO_AUTH_TOKEN` is correct
- Verify webhook URL matches exactly
- Check request parameters

**SMS not sending**
- Verify phone number format (E.164)
- Check Twilio account balance
- Verify number has SMS capability

## Best Practices

1. **Always validate webhook signatures**
2. **Store OAuth tokens encrypted**
3. **Use environment-specific credentials**
4. **Log integration events for debugging**
5. **Handle rate limits gracefully**
6. **Implement retry logic for webhooks**
7. **Monitor integration health**

## Rate Limits

### Gmail API
- 1 billion quota units per day
- Sending: 2,000 messages/day (free tier)
- Reading: Varies by operation

### Twilio
- SMS: Varies by account type
- Voice: Varies by account type
- Check dashboard for current limits

## Support Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

