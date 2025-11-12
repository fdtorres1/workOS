import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { validateRequest, PaginationSchema } from '@/lib/api/validation';
import { createErrorResponse } from '@/lib/api/errors';

const CreatePersonSchema = z.object({
  orgId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  title: z.string().max(100).optional(),
  companyId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

const UpdatePersonSchema = CreatePersonSchema.partial();

// GET /api/people - List people
export async function GET(req: NextRequest) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();

    const { searchParams } = new URL(req.url);
    const { page, limit } = validateRequest(PaginationSchema, {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const search = searchParams.get('search');
    const companyId = searchParams.get('companyId');

    let query = supabase
      .from('people')
      .select('*', { count: 'exact' })
      .eq('org_id', org.orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// POST /api/people - Create person
export async function POST(req: NextRequest) {
  try {
    const { user, org } = await requireAuth();
    const supabase = await createServerClient();

    const body = await req.json();
    const input = validateRequest(CreatePersonSchema, body);

    // Ensure orgId matches authenticated org
    if (input.orgId !== org.orgId) {
      throw new Error('Organization mismatch');
    }

    const { data, error } = await supabase
      .from('people')
      .insert({
        org_id: input.orgId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        title: input.title,
        company_id: input.companyId,
        tags: input.tags || [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}

