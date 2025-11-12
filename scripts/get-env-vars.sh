#!/bin/bash

# Script to get Supabase environment variables from linked project
# Run this after linking: supabase link --project-ref <ref>

echo "📋 Getting Supabase environment variables..."
echo ""
echo "Go to: https://app.supabase.com/project/vfwwhsguxixpjqfzhurz/settings/api"
echo ""
echo "You'll need:"
echo "1. Project URL (under 'Project URL')"
echo "2. anon public key (under 'Project API keys' → 'anon' 'public')"
echo "3. service_role key (under 'Project API keys' → 'service_role' 'secret')"
echo ""
echo "Then create apps/web/.env.local with:"
echo ""
echo "NEXT_PUBLIC_SUPABASE_URL=<your-project-url>"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
echo "SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>"
echo ""

