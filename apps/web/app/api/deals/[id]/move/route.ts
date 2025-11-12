import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { validateRequest, UuidSchema } from '@/lib/api/validation';
import { createErrorResponse, ApiError, ErrorCodes } from '@/lib/api/errors';
import { z } from 'zod';

const MoveDealSchema = z.object({
  stageId: z.string().uuid(),
});

// POST /api/deals/[id]/move - Move deal to new stage
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);
    const body = await req.json();
    const { stageId } = validateRequest(MoveDealSchema, body);

    // Verify deal exists and belongs to org
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('pipeline_id')
      .eq('id', id)
      .eq('org_id', org.orgId)
      .single();

    if (dealError || !deal) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Deal not found', 404);
    }

    // Verify stage exists and belongs to same pipeline
    const { data: stage, error: stageError } = await supabase
      .from('deal_stages')
      .select('pipeline_id')
      .eq('id', stageId)
      .eq('org_id', org.orgId)
      .single();

    if (stageError || !stage) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Stage not found', 404);
    }

    if (stage.pipeline_id !== deal.pipeline_id) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Stage does not belong to deal pipeline', 400);
    }

    // Update deal stage
    const { data, error } = await supabase
      .from('deals')
      .update({
        stage_id: stageId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', org.orgId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // TODO: Emit domain event for deal.moved

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

