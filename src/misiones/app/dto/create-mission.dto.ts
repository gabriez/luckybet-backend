import { createZodDto } from 'nestjs-zod';

import { createMissionSchema } from './mission.schema';

export class CreateMissionDto extends createZodDto(createMissionSchema) {}
