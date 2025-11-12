import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createErrorResponse } from '@/lib/api/errors';

export async function GET(req: NextRequest) {
  try {
    const { user, org } = await requireAuth();
    
    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
        },
        org: {
          orgId: org.orgId,
          role: org.role,
        },
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

