import { createServerClient } from '@/lib/supabase/server';
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
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !data) {
    throw new ApiError(ErrorCodes.FORBIDDEN, 'Not a member of any organization', 403);
  }

  return {
    orgId: data.org_id,
    role: data.role,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  const org = await getCurrentOrg(user.id);
  return { user, org };
}

