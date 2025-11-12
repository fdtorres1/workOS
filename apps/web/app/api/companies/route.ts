import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { validateRequest, PaginationSchema } from '@/lib/api/validation';
import { createErrorResponse } from '@/lib/api/errors';

const CreateCompanySchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(1).max(200),
  website: z.string().url().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/companies - List companies
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

    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .eq('org_id', org.orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
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

// POST /api/companies - Create company
export async function POST(req: NextRequest) {
  try {
    const { user, org } = await requireAuth();
    const supabase = await createServerClient();

    const body = await req.json();
    const input = validateRequest(CreateCompanySchema, body);

    if (input.orgId !== org.orgId) {
      throw new Error('Organization mismatch');
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        org_id: input.orgId,
        name: input.name,
        website: input.website,
        phone: input.phone,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        country: input.country,
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

