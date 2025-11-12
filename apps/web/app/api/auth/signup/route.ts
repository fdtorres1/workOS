import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createErrorResponse } from '@/lib/api/errors';
import { z } from 'zod';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
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

    // Create a default organization for the user
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .insert({
        name: `${name}'s Organization`,
        slug: `${name.toLowerCase().replace(/\s+/g, '-')}-org`,
      })
      .select()
      .single();

    if (orgError || !org) {
      // If org creation fails, user is still created - they can create org later
      console.error('Failed to create org:', orgError);
    } else {
      // Add user as owner of the org
      await supabase.from('org_members').insert({
        org_id: org.id,
        user_id: authData.user.id,
        role: 'owner',
      });
    }

    return NextResponse.json({
      data: {
        user: authData.user,
        session: authData.session,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

