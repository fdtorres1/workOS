import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Support both new (sb_secret_...) and legacy (service_role) keys
const supabaseSecretKey = 
  process.env.SUPABASE_SECRET_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Missing Supabase secret key. Need SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY for legacy)');
}

// Admin client that bypasses RLS - use with caution!
// Only use this in server-side code, never expose to client
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

