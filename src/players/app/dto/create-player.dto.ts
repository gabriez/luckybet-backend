import { createZodDto } from 'nestjs-zod';

import { playerSchemaWithoutId } from './player.schema';

export class CreatePlayerDto extends createZodDto(playerSchemaWithoutId) {}
