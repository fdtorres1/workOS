#!/bin/bash

# Supabase Remote Setup Script
# This script helps you connect your local project to a remote Supabase instance

echo "🔗 Setting up connection to remote Supabase..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: npm install -g supabase"
    exit 1
fi

# Prompt for project ref
read -p "Enter your Supabase Project Reference ID: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project reference ID is required"
    exit 1
fi

# Link to remote project
echo ""
echo "Linking to project: $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully linked to remote Supabase!"
    echo ""
    echo "Next steps:"
    echo "1. Push migrations: supabase db push"
    echo "2. Update apps/web/.env.local with your credentials"
    echo "3. Start dev server: pnpm dev"
else
    echo ""
    echo "❌ Failed to link. Please check your project reference ID."
    exit 1
fi

