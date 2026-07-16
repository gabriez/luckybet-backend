import { createZodDto } from 'nestjs-zod';

import { userSchemaWithoutId } from './user.schema';

export class CreateUserDto extends createZodDto(userSchemaWithoutId) {}
