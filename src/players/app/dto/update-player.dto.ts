import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

import {
	validationPlayerMessages,
	playerSchema,
} from './player.schema';

const updatePlayerSchema = playerSchema.omit({ id: true }).extend({
	createdById: z.number().nullable().optional(),
	updatedById: z.number().nullable().optional(),
});

export type UpdatePlayerDto = z.infer<typeof updatePlayerSchema>;

export class UpdatePlayerDto extends createZodDto(updatePlayerSchema) {}

export { updatePlayerSchema };