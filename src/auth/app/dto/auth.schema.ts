import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

import { apiResponseSchema } from '../../../shared/swagger/apiResponse.schema';
import { validationUserMessages } from '../../../users/app/dto/user.schema';

export const loginSchema = z.object({
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
});

export const authSchema = z.object({
	accessToken: z
		.string('El access token debe ser una string')
		.describe('Access token de autenticación'),
});

export type LoginType = z.infer<typeof loginSchema>;
export type AuthSchemaType = z.infer<typeof authSchema>;

export const loginResponseSchema = apiResponseSchema(authSchema);

export class LoginDTO extends createZodDto(loginSchema) {}
export class LoginResponseDTO extends createZodDto(loginResponseSchema) {}
