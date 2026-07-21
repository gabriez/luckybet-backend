import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

import { validationPlayerMessages } from './player.schema';

export const playerSchemaOptional = z.object({
	username: z
		.string(validationPlayerMessages.username.string)
		.min(1, validationPlayerMessages.username.min)
		.max(100, validationPlayerMessages.username.max)
		.optional()
		.describe(validationPlayerMessages.username.describe),
	email: z
		.string(validationPlayerMessages.email.string)
		.email(validationPlayerMessages.email.email)
		.optional()
		.describe(validationPlayerMessages.email.describe),
	phone: z
		.string(validationPlayerMessages.phone.string)
		.max(20, validationPlayerMessages.phone.max)
		.nullable()
		.optional()
		.describe(validationPlayerMessages.phone.describe),
	fullName: z
		.string(validationPlayerMessages.fullName.string)
		.min(1, validationPlayerMessages.fullName.min)
		.max(255, validationPlayerMessages.fullName.max)
		.optional()
		.describe(validationPlayerMessages.fullName.describe),
	isActive: z
		.boolean(validationPlayerMessages.isActive.boolean)
		.optional()
		.describe(validationPlayerMessages.isActive.describe),
});

export class UpdatePlayerDto extends createZodDto(playerSchemaOptional) {}
