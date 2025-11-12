import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { validateRequest, PaginationSchema } from '@/lib/api/validation';
import { createErrorResponse } from '@/lib/api/errors';

const CreateDealSchema = z.object({
  orgId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  name: z.string().min(1).max(200),
  companyId: z.string().uuid().optional(),
  personId: z.string().uuid().optional(),
  valueCents: z.number().int().positive().optional(),
  currency: z.string().default('USD'),
  ownerId: z.string().uuid().optional(),
  expectedCloseDate: z.string().date().optional(),
});

// GET /api/deals - List deals
export async function GET(req: NextRequest) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();

    const { searchParams } = new URL(req.url);
    const { page, limit } = validateRequest(PaginationSchema, {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const pipelineId = searchParams.get('pipelineId');
    const stageId = searchParams.get('stageId');
    const status = searchParams.get('status') as 'open' | 'won' | 'lost' | null;

    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('org_id', org.orgId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (pipelineId) {
      query = query.eq('pipeline_id', pipelineId);
    }

    if (stageId) {
      query = query.eq('stage_id', stageId);
    }

    if (status) {
      query = query.eq('status', status);
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

// POST /api/deals - Create deal
export async function POST(req: NextRequest) {
  try {
    const { user, org } = await requireAuth();
    const supabase = await createServerClient();

    const body = await req.json();
    const input = validateRequest(CreateDealSchema, body);

    if (input.orgId !== org.orgId) {
      throw new Error('Organization mismatch');
    }

    const { data, error } = await supabase
      .from('deals')
      .insert({
        org_id: input.orgId,
        pipeline_id: input.pipelineId,
        stage_id: input.stageId,
        name: input.name,
        company_id: input.companyId,
        person_id: input.personId,
        value_cents: input.valueCents,
        currency: input.currency,
        owner_id: input.ownerId,
        expected_close_date: input.expectedCloseDate,
        status: 'open',
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

