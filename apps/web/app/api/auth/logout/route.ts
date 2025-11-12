import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  
  return NextResponse.json({ data: { success: true } });
}

