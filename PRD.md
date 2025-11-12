# PRD — "WorkOS" (CRM → Lead‑Gen → Projects → Knowledge → Voice Router)

**Doc owner:** Felix  
**Last updated:** Nov 12, 2025  
**Status:** v1.0 (approved to build)

## 1. Summary & Vision

Build a modular, multi‑tenant WorkOS where each module is independently sellable, yet all share a single relational core.

### Modules (sellable):

**CRM Core** — Contacts, Companies, Deals, Tasks, Activity timeline (emails/calls/SMS/notes), Pipelines & saved views, CSV import/export, basic automations, API + Webhooks.

**Lead‑Gen (wedge; ships right after CRM)** — Sources (web forms, call tracking/Twilio, Google Business Profile inbound, ad webhooks); Routing (ZIP/service/time, caps, round‑robin; pass‑through or rev‑share); Attribution (UTM→Deal, feedback loop); LP Templates (city/service, dynamic tokens); Billing (per‑lead, per‑minute, % of revenue; Stripe); Voice Agent hook (numbers, IVR, recordings, transcripts, after‑hours scheduling).

**Projects + Time** — Kanban/board, timers, billable rates, budgets vs actual, invoice export (Stripe/QuickBooks Online), Deals→Projects linkage, SOW/retainer tracking.

**Knowledge Base** — Spaces/collections, docs (rich/MD), attachments, versions, approvals, AI search (optional) over KB + call transcripts + emails, publishable help center.

**Voice / Lead Router** — Numbers, rules, bookings, EN/ES bilingual, intent/quality confidence → warm transfer, summaries & dispositions, daily/weekly KPIs.

**Content / Calendar (optional later)** — Briefs, assets, editorial calendar, approvals; publish to site/GBP.

### AI (optional, per‑feature toggles):

- **CRM:** email draft, call summary, light lead scoring, dedupe suggestions.
- **Lead‑Gen:** caller intent classification, spam suppression, partner suggestion, Deal summary.
- **Projects:** brief/spec draft, estimate helper.
- **KB:** semantic search + answer drafts ("cite sources").
- **Org‑level controls:** enable/disable, retention window, model choice.

## 2. Target Users & JTBD

- **Owner/Operator (agency, service marketplace):** track business, route leads to partners, bill usage.
- **Sales/CS:** manage pipeline, communicate via email/SMS/calls, follow tasks, close/won attribution.
- **Fulfillment Partner:** receive leads/jobs, accept/reject, sync status and outcomes.
- **Project Manager:** plan projects, track time, report on budgets.

## 3. Success Metrics (V1–V3)

- **Activation:** Time-to-first contact created < 5 min; first email/SMS sent < 10 min.
- **Usage:** ≥ 10 activities/user/week; ≥ 1 connected Twilio/Gmail per org.
- **Lead‑Gen (post-CRM):** ≥ 80% of inbound calls/SMS classified; ≥ 95% routed within 5s; ≥ 90% attribution coverage with UTM.
- **Reliability:** p95 API < 400ms; inbound webhook processing success ≥ 99.9%; RPO 1h / RTO 4h.

## 4. Scope & Phasing

**Phase 1 (now):** CRM + Prospecting foundation
- Contacts/Companies/Deals/Tasks/Timeline; Gmail send/sync; Twilio SMS/calls; CSV import; pipelines & saved views; domain events; outbound webhooks; basic API keys.

**Phase 1b (immediately after):** Lead‑Gen "wedge"
- Lead intake endpoints (web form, Twilio inbound call → lead), UTM capture, minimal routing (owner assignment), attribution fields, partner entity groundwork, simple dashboards.

**Phase 2:** Lead Router + Fulfillment + Billing
- Full rules (ZIP/service/time, caps, round‑robin), partner delivery (email/SMS/API), accept/reject loop, billing models (per‑lead/per‑minute/% revenue) with Stripe, daily/weekly KPIs.

**Phase 3:** Projects + Time; **Phase 4:** Knowledge Base; **Phase 5:** Voice Agent, LP templates, Content/Calendar.

## 5. Non‑Goals (for Phase 1)

- No full AI features beyond summaries/dedupe scaffolding.
- No advanced billing or partner portals (placeholders only).
- No public KB/help center publishing.
- No Google Ads/Meta/LinkedIn lead‑ad connectors (spec placeholders only).

## 6. Product Requirements (Functional)

### CRM Core (Phase 1)

- CRUD for People, Companies, Deals, Pipelines/Stages, Tasks.
- Activity timeline across Emails/SMS/Calls/Notes.
- **Gmail:** OAuth, send email; poll last 7–14 days for known contacts; thread display.
- **Twilio:** outbound SMS; inbound SMS webhook; outbound/inbound calls; recording links.
- CSV import (map columns); saved views & filters.
- Basic automations: "task after contact created," "notify owner on inbound SMS."

### Lead‑Gen (Phase 1b → Phase 2)

- **Sources:** /api/leads/intake (web form), Twilio inbound call/SMS (auto‑create lead), optional GBP/Ad webhooks endpoints (stubbed).
- **Routing:** Phase 1b owner assignment; Phase 2 rules engine (ZIP/service/time, caps/round‑robin, pass‑through or rev‑share).
- **Attribution:** Capture UTM/Referrer → Person/Deal; feedback loop (won amount/job type).
- **LP Templates:** Tokenized pages for city/service with dynamic phone per partner (Phase 2–3).
- **Billing:** Usage records; Stripe integration; models: per‑lead/per‑minute/% revenue (Phase 2).
- **Voice Agent hook:** Numbers, IVV, recordings, transcripts (provider‑agnostic), after‑hours scheduler.

### Projects + Time (Phase 3)

- Kanban, timers, billable rates, budgets vs actual, invoice export (Stripe/QBO).
- Link Deals → Projects; SOW & retainers.

### Knowledge Base (Phase 4)

- Spaces, docs, attachments, versions, approvals; publishable help center; optional AI search/Citation.

### Voice / Lead Router (Phase 2+)

- Numbers, rule tree, booking handoff, EN/ES, confidence threshold → live agent, dispositions, KPIs.

### Content/Calendar (Later)

- Briefs, assets, editorial calendar, approvals; publish to site/GBP.

## 7. API, Events, Webhooks (Phase 1 scope)

- API keys per org (HMAC‑signed).
- Outbound webhooks with secret (HMAC SHA‑256) + retries (DLQ table).
- **Event types (initial):**
  - `org.created`, `person.created|updated|deleted`, `company.*`, `deal.created|moved|won|lost`,
  - `task.created|completed`, `email.sent|received`, `sms.sent|received`, `call.started|ended`,
  - `lead.created` (Phase 1b), `integration.connected|disconnected`.
- **Rate limits:** 60 req/min per API key (Phase 1), burst 120.

## 8. UX Requirements (Phase 1)

- Global search (Cmd/Ctrl+K) across People/Companies/Deals.
- Pipeline Kanban; drag to move stage.
- Person/Company detail: left = profile; right = timeline; Compose drawers for Email/SMS/Call/Note.
- Filters & saved views; tag editor; "Next Task" quick‑set.
- Settings → Integrations (Gmail/Twilio), API keys, Webhooks, Numbers mapping.

## 9. Non‑Functional Requirements

- **Security:** RLS everywhere (per‑org); least privilege; webhook signature validation.
- **Privacy:** token encryption at rest; configurable data retention per org (esp. recordings/transcripts).
- **Reliability:** p95 < 400ms; keep webhook response < 2s; async jobs for heavy work.
- **Scalability:** partition by org_id; indexes on hot fields; pagination; background queues.
- **Observability:** request‑id correlation; structured logs; event audit trail.
- **Compliance (guidance only):** call recording consent banners; CAN‑SPAM/TCPA awareness; respect email unsubscribe.

## 10. Risks & Mitigations

- **Gmail push complexity** → start with polling; add Pub/Sub later.
- **Call compliance** → configurable call‑start greeting; per‑org legal text.
- **Attribution accuracy** → standardized UTM ingestion; dedupe; outcome feedback loop.
- **Vendor lock‑in for voice/AI** → provider‑agnostic interfaces for STT/TTS and LLM.

## 11. Open Questions (tracked but not blocking Phase 1)

- Preferred initial billing model (internal use vs partner‑pay)?
- Which STT provider for transcripts (Twilio, Whisper, AWS)? (Phase 2+)
- GBP integration priority vs ad‑lead webhooks?

