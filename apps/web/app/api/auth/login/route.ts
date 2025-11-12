import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createErrorResponse } from '@/lib/api/errors';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

