import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

import {
	apiResponseSchema,
	paginatedResponseSchema,
} from '../../../shared/swagger/apiResponse.schema';

export const validationPlayerMessages = {
	username: {
		string: 'username es obligatorio como string',
		min: 'Minimo 1 caracter para el username',
		max: 'Maximo 100 caracteres para el username',
		describe: 'Nombre de usuario del jugador',
	},
	email: {
		string: 'email es obligatorio como string',
		email: 'El email debe tener un formato válido',
		describe: 'Correo electrónico del jugador',
	},
	phone: {
		string: 'phone debe ser string',
		max: 'Maximo 20 caracteres para el teléfono',
		describe: 'Número de teléfono del jugador',
	},
	fullName: {
		string: 'fullName es obligatorio como string',
		min: 'Minimo 1 caracter para el nombre completo',
		max: 'Maximo 255 caracteres para el nombre completo',
		describe: 'Nombre completo del jugador',
	},
	isActive: {
		boolean: 'Solo se aceptan valores booleanos',
		describe: 'Indica si el jugador está activo',
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
		.nullable()
		.optional()
		.describe(validationPlayerMessages.phone.describe),
	fullName: z
		.string(validationPlayerMessages.fullName.string)
		.min(1, validationPlayerMessages.fullName.min)
		.max(255, validationPlayerMessages.fullName.max)
		.describe(validationPlayerMessages.fullName.describe),
	isActive: z
		.boolean(validationPlayerMessages.isActive.boolean)
		.default(true)
		.describe(validationPlayerMessages.isActive.describe),
});

export const playerSchemaWithoutId = playerSchema.omit({ id: true });

export type Player = z.infer<typeof playerSchema>;

export type PlayerResponse = Required<Omit<Player, 'id'>> & { id: number };

export type PlayerWithoutAudit = PlayerResponse;

export type PlayerUniqueFields = Partial<Pick<Player, 'id' | 'username' | 'email'>>;

export const PlayerResponseSchema = apiResponseSchema(playerSchemaWithoutId);
export const PlayerListResponseSchema = paginatedResponseSchema(playerSchemaWithoutId);

export class PlayerListResponseDto extends createZodDto(PlayerListResponseSchema) {}
export class PlayerResponseDto extends createZodDto(PlayerResponseSchema) {}
