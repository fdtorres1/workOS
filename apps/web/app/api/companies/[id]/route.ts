import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { validateRequest, UuidSchema } from '@/lib/api/validation';
import { createErrorResponse, ApiError, ErrorCodes } from '@/lib/api/errors';
import { z } from 'zod';

const UpdateCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
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

// GET /api/companies/[id] - Get company
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('org_id', org.orgId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Company not found', 404);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// PATCH /api/companies/[id] - Update company
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);
    const body = await req.json();
    const input = validateRequest(UpdateCompanySchema, body);

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) update.name = input.name;
    if (input.website !== undefined) update.website = input.website;
    if (input.phone !== undefined) update.phone = input.phone;
    if (input.addressLine1 !== undefined) update.address_line1 = input.addressLine1;
    if (input.addressLine2 !== undefined) update.address_line2 = input.addressLine2;
    if (input.city !== undefined) update.city = input.city;
    if (input.state !== undefined) update.state = input.state;
    if (input.postalCode !== undefined) update.postal_code = input.postalCode;
    if (input.country !== undefined) update.country = input.country;
    if (input.tags !== undefined) update.tags = input.tags;

    const { data, error } = await supabase
      .from('companies')
      .update(update)
      .eq('id', id)
      .eq('org_id', org.orgId)
      .select()
      .single();

    if (error || !data) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Company not found', 404);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// DELETE /api/companies/[id] - Delete company (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { org } = await requireAuth();
    const supabase = await createServerClient();
    const id = validateRequest(UuidSchema, params.id);

    const { error } = await supabase
      .from('companies')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', org.orgId);

    if (error) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Company not found', 404);
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return createErrorResponse(error);
  }
}

