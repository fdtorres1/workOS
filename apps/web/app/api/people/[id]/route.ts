import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { validateRequest, UuidSchema } from '@/lib/api/validation';
import { createErrorResponse, ApiError, ErrorCodes } from '@/lib/api/errors';
import { z } from 'zod';

const UpdatePersonSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  title: z.string().max(100).optional(),
  companyId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/people/[id] - Get person
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);

    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .eq('org_id', org.orgId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Person not found', 404);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// PATCH /api/people/[id] - Update person
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);
    const body = await req.json();
    const input = validateRequest(UpdatePersonSchema, body);

    // Build update object
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.firstName !== undefined) update.first_name = input.firstName;
    if (input.lastName !== undefined) update.last_name = input.lastName;
    if (input.email !== undefined) update.email = input.email;
    if (input.phone !== undefined) update.phone = input.phone;
    if (input.title !== undefined) update.title = input.title;
    if (input.companyId !== undefined) update.company_id = input.companyId;
    if (input.tags !== undefined) update.tags = input.tags;

    const { data, error } = await supabase
      .from('people')
      .update(update)
      .eq('id', id)
      .eq('org_id', org.orgId)
      .select()
      .single();

    if (error || !data) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Person not found', 404);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// DELETE /api/people/[id] - Delete person (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);

    const { error } = await supabase
      .from('people')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', org.orgId);

    if (error) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Person not found', 404);
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return createErrorResponse(error);
  }
}

