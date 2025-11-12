-- Enable Row Level Security on all tables with org_id

-- Orgs
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY orgs_select ON orgs
  FOR SELECT
  USING (is_member_of(id));
CREATE POLICY orgs_write ON orgs
  FOR ALL
  USING (is_member_of(id))
  WITH CHECK (is_member_of(id));

-- Org Members
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_members_select ON org_members
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY org_members_write ON org_members
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_select ON companies
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY companies_write ON companies
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- People
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
CREATE POLICY people_select ON people
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY people_write ON people
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Pipelines
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY pipelines_select ON pipelines
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY pipelines_write ON pipelines
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Deal Stages
ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY deal_stages_select ON deal_stages
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY deal_stages_write ON deal_stages
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY deals_select ON deals
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY deals_write ON deals
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_select ON tasks
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY tasks_write ON tasks
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Interactions
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY interactions_select ON interactions
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY interactions_write ON interactions
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Emails
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY emails_select ON emails
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY emails_write ON emails
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- SMS
ALTER TABLE sms ENABLE ROW LEVEL SECURITY;
CREATE POLICY sms_select ON sms
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY sms_write ON sms
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Calls
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY calls_select ON calls
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY calls_write ON calls
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY integrations_select ON integrations
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY integrations_write ON integrations
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- API Keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY api_keys_select ON api_keys
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY api_keys_write ON api_keys
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhooks_select ON webhooks
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY webhooks_write ON webhooks
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Webhook Deliveries
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_deliveries_select ON webhook_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_deliveries.webhook_id
      AND is_member_of(w.org_id)
    )
  );

-- Domain Events
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY domain_events_select ON domain_events
  FOR SELECT
  USING (is_member_of(org_id));

-- Phones
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
CREATE POLICY phones_select ON phones
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY phones_write ON phones
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_select ON leads
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY leads_write ON leads
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Fulfillment Partners
ALTER TABLE fulfillment_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY fulfillment_partners_select ON fulfillment_partners
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY fulfillment_partners_write ON fulfillment_partners
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

-- Lead Deliveries
ALTER TABLE lead_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_deliveries_select ON lead_deliveries
  FOR SELECT
  USING (is_member_of(org_id));
CREATE POLICY lead_deliveries_write ON lead_deliveries
  FOR ALL
  USING (is_member_of(org_id))
  WITH CHECK (is_member_of(org_id));

