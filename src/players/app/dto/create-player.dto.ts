import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

import {
	validationPlayerMessages,
	playerSchema,
} from './player.schema';

const createPlayerSchema = playerSchema.omit({ id: true }).extend({
	createdById: z.number().nullable().optional(),
	updatedById: z.number().nullable().optional(),
});

export type CreatePlayerDto = z.infer<typeof createPlayerSchema>;

export class CreatePlayerDto extends createZodDto(createPlayerSchema) {}

export { createPlayerSchema };