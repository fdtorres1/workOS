# Security Guidelines

## Overview

Security is a top priority for WorkOS. This document outlines security best practices and requirements.

## Authentication & Authorization

### Supabase Auth

- Use Supabase Auth for user authentication
- JWT tokens for session management
- Refresh tokens stored securely

### Row Level Security (RLS)

**Critical:** All tables with `org_id` must have RLS enabled.

```sql
-- Always enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY table_select ON table_name
  FOR SELECT USING (is_member_of(org_id));
```

### API Key Security

- Store API keys as hashes (never plaintext)
- Use HMAC for key generation
- Show raw key only once on creation
- Implement key rotation

```typescript
import crypto from 'crypto';

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function generateApiKey(): string {
  return `wos_${crypto.randomBytes(32).toString('hex')}`;
}
```

## Data Protection

### Encryption at Rest

- OAuth tokens encrypted before storage
- Use Supabase Edge Functions for token management
- Never expose service role keys

### Encryption in Transit

- Always use HTTPS in production
- TLS 1.2+ required
- HSTS headers enabled

### PII Handling

- Minimize collection of PII
- Encrypt sensitive fields
- Implement data retention policies
- Support GDPR deletion requests

## Webhook Security

### Signature Validation

**Always validate webhook signatures:**

```typescript
// Twilio
import twilio from 'twilio';

const isValid = twilio.validateRequest(
  process.env.TWILIO_AUTH_TOKEN!,
  signature,
  url,
  params
);

// Custom webhooks
import crypto from 'crypto';

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Webhook Retries

- Implement exponential backoff
- Maximum retry attempts (e.g., 5)
- Dead letter queue for failures
- Log all delivery attempts

## Input Validation

### Use Zod for Validation

```typescript
import { z } from 'zod';

const CreatePersonSchema = z.object({
  orgId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

// In API route
const input = CreatePersonSchema.parse(await req.json());
```

### Sanitize User Input

- Sanitize HTML in user-generated content
- Escape SQL queries (use parameterized queries)
- Validate file uploads (type, size)
- Rate limit input endpoints

## SQL Injection Prevention

### Use Parameterized Queries

**Never do this:**
```typescript
// ❌ BAD - SQL injection risk
const query = `SELECT * FROM people WHERE email = '${email}'`;
```

**Always do this:**
```typescript
// ✅ GOOD - Parameterized
const { data } = await supabase
  .from('people')
  .select()
  .eq('email', email);
```

## XSS Prevention

### Sanitize Output

- Use React's built-in XSS protection
- Sanitize HTML before rendering
- Use Content Security Policy (CSP)

```typescript
// Sanitize HTML
import DOMPurify from 'isomorphic-dompurify';

const cleanHtml = DOMPurify.sanitize(userInput);
```

### CSP Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

## Rate Limiting

### API Rate Limits

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

### Apply to API Routes

```typescript
// app/api/people/route.ts
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const apiKey = req.headers.get('authorization');
  const { success } = await checkRateLimit(`api:${apiKey}`);
  
  if (!success) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // ... rest of handler
}
```

## Secrets Management

### Environment Variables

- Never commit secrets to git
- Use `.env.local` for local development
- Use Vercel/Supabase secrets for production
- Rotate secrets regularly

### Secret Rotation

- API keys: Every 90 days
- OAuth secrets: When compromised
- Database passwords: Annually
- Webhook secrets: Per integration

## Compliance

### GDPR

- Right to access data
- Right to deletion
- Data portability
- Privacy policy

### CAN-SPAM / TCPA

- Email unsubscribe handling
- SMS opt-out support
- Call recording consent
- Do-not-call list respect

### Implementation

```typescript
// Check unsubscribe status
async function canSendEmail(personId: string): Promise<boolean> {
  const { data } = await supabase
    .from('people')
    .select('email_opt_out')
    .eq('id', personId)
    .single();
  
  return !data?.email_opt_out;
}
```

## Audit Logging

### Log Security Events

```typescript
// lib/audit.ts
export async function logSecurityEvent(
  orgId: string,
  event: string,
  details: Record<string, any>
) {
  await supabase.from('audit_logs').insert({
    org_id: orgId,
    event_type: event,
    details,
    occurred_at: new Date().toISOString(),
  });
}

// Usage
await logSecurityEvent(orgId, 'api_key_created', {
  keyId: key.id,
  userId: user.id,
});
```

### Track Failed Auth Attempts

- Log failed login attempts
- Implement account lockout after N failures
- Alert on suspicious activity

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update

# Use Dependabot for automated updates
```

### Dependency Review

- Review all new dependencies
- Check for known vulnerabilities
- Prefer well-maintained packages
- Minimize dependency count

## Infrastructure Security

### Vercel

- Enable Vercel Security Headers
- Use Vercel's DDoS protection
- Enable Vercel Analytics

### Supabase

- Use connection pooling
- Enable Supabase Auth
- Configure IP allowlists (if needed)
- Regular backups

## Incident Response

### Security Incident Process

1. **Identify** - Detect security issue
2. **Contain** - Limit damage
3. **Eradicate** - Remove threat
4. **Recover** - Restore services
5. **Learn** - Post-mortem and improve

### Contact

- Security issues: security@workos.com
- Report vulnerabilities responsibly
- Follow responsible disclosure

## Security Checklist

### Development

- [ ] RLS enabled on all tables
- [ ] Input validation with Zod
- [ ] Webhook signatures validated
- [ ] API keys hashed
- [ ] OAuth tokens encrypted
- [ ] Rate limiting implemented
- [ ] Error messages don't leak info
- [ ] Secrets not in code
- [ ] Dependencies up to date

### Deployment

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Environment variables set
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Logging enabled
- [ ] Access logs reviewed

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)

