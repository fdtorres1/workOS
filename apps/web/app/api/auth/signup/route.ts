import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: {
          getItem: (key: string) => cookieStore.get(key)?.value,
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
      await supabaseAdmin.from('org_members').insert({
        org_id: org.id,
        user_id: authData.user.id,
        role: 'owner',
      });
    }

    // Set auth cookies if session exists
    if (authData.session) {
      cookieStore.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      cookieStore.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return NextResponse.json({
      data: {
        user: authData.user,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

