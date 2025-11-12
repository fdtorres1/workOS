import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ApiError, ErrorCodes } from './errors';

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Not authenticated', 401);
  }

  return user;
}

export async function getCurrentOrg(userId: string) {
  const supabase = await createServerClient();
  
  // First, try to get existing org membership using admin client to bypass RLS
  const { data: orgMembers, error: orgCheckError } = await supabaseAdmin
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .limit(1);

  if (orgMembers && orgMembers.length > 0) {
    return {
      orgId: orgMembers[0].org_id,
      role: orgMembers[0].role,
    };
  }

  // If no org found, try to create one automatically
  // Get user metadata for org name
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Not authenticated', 401);
  }

  const fullName = user.user_metadata?.full_name || 'User';
  const slug = `${fullName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  
  // Create organization using admin client
  const { data: org, error: orgError } = await supabaseAdmin
    .from('orgs')
    .insert({
      name: `${fullName}'s Organization`,
      slug: slug,
    })
    .select()
    .single();

  if (orgError || !org) {
    console.error('Failed to auto-create organization:', orgError);
    throw new ApiError(ErrorCodes.FORBIDDEN, 'Not a member of any organization', 403);
  }

  // Add user as owner of the org
  const { error: memberError } = await supabaseAdmin.from('org_members').insert({
    org_id: org.id,
    user_id: userId,
    role: 'owner',
  });

  if (memberError) {
    console.error('Failed to add user to auto-created organization:', memberError);
    throw new ApiError(ErrorCodes.FORBIDDEN, 'Not a member of any organization', 403);
  }

  return {
    orgId: org.id,
    role: 'owner',
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  const org = await getCurrentOrg(user.id);
  return { user, org };
}

