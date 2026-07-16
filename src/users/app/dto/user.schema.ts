import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

import {
	apiResponseSchema,
	paginatedResponseSchema,
} from '../../../shared/swagger/apiResponse.schema';
import { AdminRoles } from '../entities/user.entity';

export const validationUserMessages = {
	username: {
		string: 'username es obligatorio como string',
		min: 'Minimo 3 caracteres para el username',
		max: 'Maximo 20 caracteres para el username',
		describe: 'Nombre de usuario',
	},
	password: {
		string: 'password es obligatorio como string',
		min: 'Minimo 6 caracteres para el password',
		max: 'Maximo 50 caracteres para el password',
		describe: 'Contraseña del usuario',
	},
	role: {
		enum: 'Valores validos: SUPER_ADMIN o REVIEWER',
		describe: 'Rol del usuario',
	},
	isActive: {
		describe: 'Indica si el usuario está activo',
		boolean: 'Solo se aceptan valores booleanos',
	},
};

export const userSchema = z.object({
	id: z.number().optional().describe('ID del usuario'),
	username: z
		.string(validationUserMessages.username.string)
		.min(3, validationUserMessages.username.min)
		.max(20, validationUserMessages.username.max)
		.describe(validationUserMessages.username.describe),
	password: z
		.string(validationUserMessages.password.string)
		.min(6, validationUserMessages.password.min)
		.max(50, validationUserMessages.password.max)
		.describe(validationUserMessages.password.describe),
	role: z
		.enum(AdminRoles, validationUserMessages.role.enum)
		.describe(validationUserMessages.role.describe),
	isActive: z
		.boolean(validationUserMessages.isActive.boolean)
		.default(true)
		.describe(validationUserMessages.isActive.describe),
});

export const userSchemaWithoutPassword = userSchema.omit({ password: true });
export const userSchemaWithoutId = userSchema.omit({ id: true });

export type User = z.infer<typeof userSchema>;

export type UserWithoutPassword = Omit<Required<User>, 'password'>;

export interface UserWithMethods extends UserWithoutPassword {
	comparePassword(password: string): Promise<boolean>;
}

export type UserUniqueFields = Partial<Omit<User, 'password' | 'role' | 'isActive'>>;

export const UserResponseSchema = apiResponseSchema(userSchemaWithoutPassword);

export const UserListResponseSchema = paginatedResponseSchema(userSchemaWithoutPassword);

export class UserListResponseDto extends createZodDto(UserListResponseSchema) {}
export class UserResponseDto extends createZodDto(UserResponseSchema) {}
