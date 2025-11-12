import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type'); // 'signup' or 'recovery'
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const cookieStore = await cookies();
  const cookiesToSet: Array<{ name: string; value: string; options?: any }> = [];
  
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSetArray) {
        cookiesToSetArray.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          cookiesToSet.push({ name, value, options });
        });
      },
    },
  });

  // Exchange the token for a session
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'email' | 'recovery',
    });

    if (error) {
      console.error('Email confirmation error:', error);
      // Redirect to login with error message
      const redirectUrl = new URL('/login', requestUrl.origin);
      redirectUrl.searchParams.set('error', 'email_confirmation_failed');
      return NextResponse.redirect(redirectUrl.toString());
    }

    if (data.session && data.user) {
      // Ensure the user has an organization (in case org creation failed during signup)
      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', data.user.id)
        .limit(1)
        .single();

      if (!orgMember) {
        // Create default organization if it doesn't exist
        const slug = `${data.user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'user'}-${Date.now()}`;
        const { data: org, error: orgError } = await supabaseAdmin
          .from('orgs')
          .insert({
            name: `${data.user.user_metadata?.full_name || 'User'}'s Organization`,
            slug: slug,
          })
          .select()
          .single();

        if (!orgError && org) {
          await supabaseAdmin.from('org_members').insert({
            org_id: org.id,
            user_id: data.user.id,
            role: 'owner',
          });
        }
      }

      // Create response with redirect
      const redirectResponse = NextResponse.redirect(new URL(next, requestUrl.origin));
      
      // Apply all cookies that were set during authentication
      cookiesToSet.forEach(({ name, value, options }) => {
        redirectResponse.cookies.set(name, value, options);
      });
      
      return redirectResponse;
    }
  }

  // If no token or verification failed, redirect to login
  const redirectUrl = new URL('/login', requestUrl.origin);
  redirectUrl.searchParams.set('error', 'invalid_confirmation_link');
  return NextResponse.redirect(redirectUrl.toString());
}

