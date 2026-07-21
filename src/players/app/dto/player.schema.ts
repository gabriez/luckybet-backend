import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

import {
	apiResponseSchema,
	paginatedResponseSchema,
} from '../../../shared/swagger/apiResponse.schema';

export const validationPlayerMessages = {
	username: {
		string: 'username es obligatorio como string',
		min: 'Minimo 1 caracteres para el username',
		max: 'Maximo 100 caracteres para el username',
		describe: 'Nombre de usuario',
	},
	email: {
		string: 'email es obligatorio como string',
		email: 'Email debe tener formato válido',
		describe: 'Correo electrónico',
	},
	phone: {
		string: 'phone debe ser string',
		max: 'Maximo 20 caracteres para el teléfono',
		describe: 'Número de teléfono',
	},
	fullName: {
		string: 'fullName es obligatorio como string',
		min: 'Minimo 1 caracteres para el nombre completo',
		max: 'Maximo 255 caracteres para el nombre completo',
		describe: 'Nombre completo',
	},
};

export const playerSchema = z.object({
	id: z.number().optional().describe('ID del jugador'),
	username: z
		.string(validationPlayerMessages.username.string)
		.min(1, validationPlayerMessages.username.min)
		.max(100, validationPlayerMessages.username.max)
		.describe(validationPlayerMessages.username.describe),
	email: z
		.string(validationPlayerMessages.email.string)
		.email(validationPlayerMessages.email.email)
		.describe(validationPlayerMessages.email.describe),
	phone: z
		.string(validationPlayerMessages.phone.string)
		.max(20, validationPlayerMessages.phone.max)
		.optional()
		.describe(validationPlayerMessages.phone.describe),
	fullName: z
		.string(validationPlayerMessages.fullName.string)
		.min(1, validationPlayerMessages.fullName.min)
		.max(255, validationPlayerMessages.fullName.max)
		.describe(validationPlayerMessages.fullName.describe),
	isActive: z
		.boolean()
		.default(true)
		.describe('Indica si el jugador está activo'),
});

export const playerSchemaWithoutAudit = playerSchema.omit({ id: true }).extend({
	createdById: z.number().nullable().optional(),
	updatedById: z.number().nullable().optional(),
});

export const playerSchemaWithoutId = playerSchema.omit({ id: true });

export type Player = z.infer<typeof playerSchema>;
export type PlayerWithoutAudit = Omit<Player, 'id' | 'createdById' | 'updatedById'>;
export type PlayerUniqueFields = Partial<Pick<Player, 'username' | 'email' | 'phone'>>;

export const PlayerResponseSchema = apiResponseSchema(playerSchemaWithoutAudit);
export const PlayerListResponseSchema = paginatedResponseSchema(playerSchemaWithoutAudit);

export class PlayerListResponseDto extends createZodDto(PlayerListResponseSchema) {}
export class PlayerResponseDto extends createZodDto(PlayerResponseSchema) {}