import type { ZodType } from 'zod';

import { z } from 'zod';

import { PaginationMetaSchema } from './pagination.schema';

export function apiResponseSchema<T extends ZodType>(dataSchema: T) {
  return z.object({
    status: z.boolean().default(true),
    data: dataSchema,
    message: z.string().default('Success'),
  });
}

export function paginatedResponseSchema<T extends ZodType>(itemSchema: T) {
  return z.object({
    status: z.boolean().default(true),
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
    message: z.string().default('Success'),
  });
}
