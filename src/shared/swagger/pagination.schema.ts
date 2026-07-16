import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaginationMetaSchema = z.object({
	total: z.number().int().describe('Total de registros'),
	page: z.number().int().describe('Pagina actual'),
	limit: z.number().int().describe('Limite por pagina'),
	totalPages: z.number().int().describe('Total de paginas'),
	hasPreviousPage: z.boolean().describe('Si hay pagina anterior'),
	hasNextPage: z.boolean().describe('Si hay pagina siguiente'),
});

export const BasePaginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1).describe('Numero de pagina'),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(10)
		.describe('Registros por pagina'),
});

export class PaginationMetaDto extends createZodDto(PaginationMetaSchema) {}
export class BasePaginationQueryDto extends createZodDto(BasePaginationQuerySchema) {}
