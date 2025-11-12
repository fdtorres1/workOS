import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { validateRequest, UuidSchema } from '@/lib/api/validation';
import { createErrorResponse, ApiError, ErrorCodes } from '@/lib/api/errors';
import { z } from 'zod';

const UpdateDealSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  stageId: z.string().uuid().optional(),
  valueCents: z.number().int().positive().optional(),
  currency: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  expectedCloseDate: z.string().date().optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
});

// GET /api/deals/[id] - Get deal
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);

    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .eq('org_id', org.orgId)
      .single();

    if (error || !data) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Deal not found', 404);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// PATCH /api/deals/[id] - Update deal
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);
    const body = await req.json();
    const input = validateRequest(UpdateDealSchema, body);

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) update.name = input.name;
    if (input.stageId !== undefined) update.stage_id = input.stageId;
    if (input.valueCents !== undefined) update.value_cents = input.valueCents;
    if (input.currency !== undefined) update.currency = input.currency;
    if (input.ownerId !== undefined) update.owner_id = input.ownerId;
    if (input.expectedCloseDate !== undefined) update.expected_close_date = input.expectedCloseDate;
    if (input.status !== undefined) {
      update.status = input.status;
      if (input.status === 'won' || input.status === 'lost') {
        update.closed_at = new Date().toISOString();
      } else {
        update.closed_at = null;
      }
    }

    const { data, error } = await supabase
      .from('deals')
      .update(update)
      .eq('id', id)
      .eq('org_id', org.orgId)
      .select()
      .single();

    if (error || !data) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Deal not found', 404);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// DELETE /api/deals/[id] - Delete deal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)
      .eq('org_id', org.orgId);

    if (error) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Deal not found', 404);
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return createErrorResponse(error);
  }
}

