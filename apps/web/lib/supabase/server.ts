import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Support both new (sb_publishable_...) and legacy (anon) keys
const supabasePublishableKey = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables. Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY for legacy)');
}

export async function createServerClient() {
  const cookieStore = await cookies();
  
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          // Try Supabase's default cookie names first
          const value = cookieStore.get(key)?.value;
          if (value) return value;
          
          // Fallback to our custom cookie names
          if (key.includes('access-token')) {
            return cookieStore.get('sb-access-token')?.value;
          }
          if (key.includes('refresh-token')) {
            return cookieStore.get('sb-refresh-token')?.value;
          }
          return null;
        },
        setItem: (key: string, value: string) => {
          cookieStore.set(key, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        },
        removeItem: (key: string) => {
          cookieStore.delete(key);
        },
      },
    },
  });
}

