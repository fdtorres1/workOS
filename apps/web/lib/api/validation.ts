import { z } from 'zod';
import { ApiError, ErrorCodes } from './errors';

export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        400,
        error.errors
      );
    }
    throw error;
  }
}

// Common validation schemas
export const UuidSchema = z.string().uuid();
export const OrgIdSchema = UuidSchema;
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

