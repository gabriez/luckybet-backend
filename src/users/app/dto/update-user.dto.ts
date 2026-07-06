import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';
import { AdminRoles } from '../entities/user.entity';
import { validationMessages } from './user.schema';

export const userSchemaOptional = z.object({
  username: z
    .string(validationMessages.username.string)
    .min(3, validationMessages.username.min)
    .max(20, validationMessages.username.max)
    .optional()
    .describe(validationMessages.username.describe),
  password: z
    .string(validationMessages.password.string)
    .min(6, validationMessages.password.min)
    .max(50, validationMessages.password.max)
    .optional()
    .describe('Contraseña del usuario'),
  role: z
    .enum(AdminRoles, validationMessages.role.enum)
    .optional()
    .describe(validationMessages.role.describe),
  isActive: z
    .boolean(validationMessages.isActive.boolean)
    .optional()
    .describe(validationMessages.isActive.describe),
});

export class UpdateUserDto extends createZodDto(userSchemaOptional) {}
