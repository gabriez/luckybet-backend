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
  phone: {
    string: 'phone debe ser string',
    max: 'Maximo 20 caracteres para el teléfono',
    describe: 'Número de teléfono del jugador',
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
  phone: z
    .string(validationPlayerMessages.phone.string)
    .max(20, validationPlayerMessages.phone.max)
    .nullable()
    .optional()
    .describe(validationPlayerMessages.phone.describe),
  isActive: z
    .boolean(validationPlayerMessages.isActive.boolean)
    .default(true)
    .describe(validationPlayerMessages.isActive.describe),
});

export const playerSchemaWithoutId = playerSchema.omit({ id: true });

export type Player = z.infer<typeof playerSchema>;

export type PlayerResponse = Required<Omit<Player, 'id'>> & { id: number };

export type PlayerWithoutAudit = PlayerResponse;

export type PlayerUniqueFields = Partial<Pick<Player, 'id' | 'username'>>;

export const PlayerResponseSchema = apiResponseSchema(playerSchemaWithoutId);
export const PlayerListResponseSchema = paginatedResponseSchema(
  playerSchemaWithoutId,
);

export class PlayerListResponseDto extends createZodDto(
  PlayerListResponseSchema,
) {}
export class PlayerResponseDto extends createZodDto(PlayerResponseSchema) {}
