import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createErrorResponse } from '@/lib/api/errors';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check if user already has an organization
    // Use admin client to bypass RLS in case user doesn't have org yet
    const { data: orgMembers, error: orgCheckError } = await supabaseAdmin
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1);

    if (orgCheckError) {
      console.error('Error checking org membership:', orgCheckError);
    }

    if (orgMembers && orgMembers.length > 0) {
      return NextResponse.json({ data: { orgId: orgMembers[0].org_id } });
    }

    // Create default organization if it doesn't exist
    const fullName = user.user_metadata?.full_name || 'User';
    const slug = `${fullName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    const { data: org, error: orgError } = await supabaseAdmin
      .from('orgs')
      .insert({
        name: `${fullName}'s Organization`,
        slug: slug,
      })
      .select()
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: { message: 'Failed to create organization' } },
        { status: 500 }
      );
    }

    // Add user as owner of the org
    const { error: memberError } = await supabaseAdmin.from('org_members').insert({
      org_id: org.id,
      user_id: user.id,
      role: 'owner',
    });

    if (memberError) {
      return NextResponse.json(
        { error: { message: 'Failed to add user to organization' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { orgId: org.id } });
  } catch (error) {
    return createErrorResponse(error);
  }
}

