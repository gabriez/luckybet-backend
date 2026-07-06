import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const BaseErrorSchema = z.object({
  status: z.boolean().default(false).describe('Estado de la operacion'),
  data: z.null().describe('Sin datos en respuesta de error'),
  message: z.string().describe('Mensaje de error'),
});

export const ServerErrorSchema = BaseErrorSchema.extend({
  message: z
    .string()
    .default(
      'Ocurrio un error inesperado. Por favor, intentelo de nuevo mas tarde',
    ),
});

export const AuthErrorSchema = BaseErrorSchema.extend({
  message: z.string().default('No se pudo verificar el token de autenticacion'),
});

export const ForbiddenSchema = BaseErrorSchema.extend({
  message: z.string().default('Falta el token de autenticacion'),
});

export const NotFoundSchema = BaseErrorSchema.extend({
  message: z.string().default('El registro no fue encontrado'),
});

export const ConflictSchema = BaseErrorSchema.extend({
  message: z
    .string()
    .default(
      'No se puede eliminar el registro porque esta relacionado con otros registros',
    ),
});

export const ValidationErrorSchema = BaseErrorSchema.extend({
  message: z.string().default('Datos de validacion incorrectos'),
  errors: z
    .record(z.string(), z.string())
    .describe('Errores de validacion por campo'),
});

export class ServerErrorDto extends createZodDto(ServerErrorSchema) {}
export class AuthErrorDto extends createZodDto(AuthErrorSchema) {}
export class ForbiddenDto extends createZodDto(ForbiddenSchema) {}
export class NotFoundDto extends createZodDto(NotFoundSchema) {}
export class ConflictDto extends createZodDto(ConflictSchema) {}
export class ValidationErrorDto extends createZodDto(ValidationErrorSchema) {}
