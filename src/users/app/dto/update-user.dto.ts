import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

import { AdminRoles } from '../entities/user.entity';
import { validationUserMessages } from './user.schema';

export const userSchemaOptional = z.object({
	username: z
		.string(validationUserMessages.username.string)
		.min(3, validationUserMessages.username.min)
		.max(20, validationUserMessages.username.max)
		.optional()
		.describe(validationUserMessages.username.describe),
	password: z
		.string(validationUserMessages.password.string)
		.min(6, validationUserMessages.password.min)
		.max(50, validationUserMessages.password.max)
		.optional()
		.describe('Contraseña del usuario'),
	role: z
		.enum(AdminRoles, validationUserMessages.role.enum)
		.optional()
		.describe(validationUserMessages.role.describe),
	isActive: z
		.boolean(validationUserMessages.isActive.boolean)
		.optional()
		.describe(validationUserMessages.isActive.describe),
});

export class UpdateUserDto extends createZodDto(userSchemaOptional) {}
