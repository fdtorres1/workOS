import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createErrorResponse } from '@/lib/api/errors';
import { z } from 'zod';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { email, password, name } = SignupSchema.parse(body);

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${req.nextUrl.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: { message: authError.message } },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: { message: 'Failed to create user' } },
        { status: 500 }
      );
    }

    // Create a default organization for the user (using admin client to bypass RLS)
    // This should happen regardless of whether email confirmation is required
    const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const { data: org, error: orgError } = await supabaseAdmin
      .from('orgs')
      .insert({
        name: `${name}'s Organization`,
        slug: slug,
      })
      .select()
      .single();

    if (orgError || !org) {
      console.error('Failed to create org:', orgError);
    } else {
      // Add user as owner of the org (using admin client)
      const { error: memberError } = await supabaseAdmin.from('org_members').insert({
        org_id: org.id,
        user_id: authData.user.id,
        role: 'owner',
      });
      
      if (memberError) {
        console.error('Failed to add user to org:', memberError);
      }
    }

    // Check if email confirmation is required
    if (!authData.session) {
      // Email confirmation required - return success but indicate confirmation needed
      return NextResponse.json(
        {
          data: {
            user: authData.user,
            requiresConfirmation: true,
          },
        },
        { status: 200 }
      );
    }

    // Return response with cookies included
    const jsonResponse = NextResponse.json({
      data: {
        user: authData.user,
        session: authData.session,
      },
    });
    
    // Apply all cookies that were set during authentication
    cookiesToSet.forEach(({ name, value, options }) => {
      jsonResponse.cookies.set(name, value, options);
    });
    
    return jsonResponse;
  } catch (error) {
    return createErrorResponse(error);
  }
}

