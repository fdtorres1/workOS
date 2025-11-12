# Code Stubs - Phase 1 Implementation Examples

## app/api/sms/send/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const Body = z.object({
  orgId: z.string().uuid(),
  personId: z.string().uuid().optional(),
  to: z.string().optional(),        // E.164
  from: z.string(),                 // your Twilio number
  body: z.string().min(1).max(800)
});

export async function POST(req: NextRequest) {
  const input = Body.parse(await req.json());
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const to = input.to ?? (await resolvePhoneForPerson(supabase, input.orgId, input.personId!));
  const msg = await client.messages.create({ to, from: input.from, body: input.body });

  await supabase.from('sms').insert({
    org_id: input.orgId,
    person_id: input.personId ?? null,
    direction: 'outbound',
    twilio_sid: msg.sid,
    from_number: input.from,
    to_number: to,
    body: input.body,
    status: msg.status,
    sent_at: new Date().toISOString()
  });

  await supabase.from('interactions').insert({
    org_id: input.orgId,
    type: 'sms',
    person_id: input.personId ?? null,
    occurred_at: new Date().toISOString(),
    summary: `SMS to ${to}: ${input.body.slice(0,120)}`,
    metadata: { twilio_sid: msg.sid }
  });

  return NextResponse.json({ ok: true, sid: msg.sid });
}

async function resolvePhoneForPerson(supabase: any, orgId: string, personId: string): Promise<string> {
  const { data, error } = await supabase.from('people')
    .select('phone').eq('org_id', orgId).eq('id', personId).single();
  if (error || !data?.phone) throw new Error('Phone not found for person');
  return data.phone;
}
```

## app/api/webhooks/twilio/sms/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw));
  const signature = req.headers.get('x-twilio-signature') ?? '';
  const url = process.env.PUBLIC_TWILIO_SMS_WEBHOOK_URL!;

  if (!twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN!, signature, url, params)) {
    return new NextResponse('Invalid signature', { status: 403 });
  }

  const from = params.From;
  const to = params.To;
  const body = params.Body;

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Resolve org/person by inbound number (map "to" -> org; "from" -> person)
  const { data: orgMap } = await supabase.rpc('resolve_org_by_twilio_number', { phone_in: to });
  const orgId = orgMap?.org_id;
  const { data: person } = await supabase.rpc('resolve_person_by_phone', { org_in: orgId, phone_in: from });

  await supabase.from('sms').insert({
    org_id: orgId,
    person_id: person?.id ?? null,
    direction: 'inbound',
    from_number: from,
    to_number: to,
    body,
    status: 'received',
    sent_at: new Date().toISOString()
  });

  await supabase.from('interactions').insert({
    org_id: orgId,
    type: 'sms',
    person_id: person?.id ?? null,
    occurred_at: new Date().toISOString(),
    summary: `SMS from ${from}: ${body.slice(0,120)}`
  });

  // Twilio expects a response; for SMS, empty 200 is fine
  return NextResponse.json({ ok: true });
}
```

## app/api/email/send/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const Body = z.object({
  orgId: z.string().uuid(),
  personId: z.string().uuid().optional(),
  to: z.string().email().optional(),
  subject: z.string(),
  html: z.string()
});

export async function POST(req: NextRequest) {
  const input = Body.parse(await req.json());
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Fetch encrypted refresh token from a private store via Edge Function (recommended)
  const { token, userEmail } = await fetch(process.env.GMAIL_TOKEN_ENDPOINT!, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.INTERNAL_API_KEY! },
    body: JSON.stringify({ orgId: input.orgId })
  }).then(r => r.json());

  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: token });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const to = input.to ?? await resolveEmailForPerson(supabase, input.orgId, input.personId!);
  const raw = buildMime(userEmail, to, input.subject, input.html);
  const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  const msg = res.data;

  await supabase.from('emails').insert({
    org_id: input.orgId,
    person_id: input.personId ?? null,
    direction: 'outbound',
    gmail_message_id: msg.id,
    gmail_thread_id: msg.threadId,
    subject: input.subject,
    body_html: input.html,
    from_address: userEmail,
    to_addresses: [to],
    sent_at: new Date().toISOString(),
    status: 'sent'
  });

  await supabase.from('interactions').insert({
    org_id: input.orgId,
    type: 'email',
    person_id: input.personId ?? null,
    occurred_at: new Date().toISOString(),
    summary: `Email to ${to}: ${input.subject}`
  });

  return NextResponse.json({ ok: true, id: msg.id });
}

function buildMime(from: string, to: string, subject: string, html: string) {
  const str = [
    `From: <${from}>`,
    `To: <${to}>`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html
  ].join('\r\n');
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

async function resolveEmailForPerson(supabase: any, orgId: string, personId: string): Promise<string> {
  const { data, error } = await supabase.from('people')
    .select('email').eq('org_id', orgId).eq('id', personId).single();
  if (error || !data?.email) throw new Error('Email not found for person');
  return data.email;
}
```

