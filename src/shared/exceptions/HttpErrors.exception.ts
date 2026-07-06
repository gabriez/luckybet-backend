import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

const GENERIC_HTTP_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Datos de validacion incorrectos',
  [HttpStatus.UNAUTHORIZED]: 'No se pudo verificar el token de autenticacion',
  [HttpStatus.FORBIDDEN]: 'Falta el token de autenticacion',
  [HttpStatus.NOT_FOUND]: 'El registro no fue encontrado',
  [HttpStatus.CONFLICT]:
    'No se puede eliminar el registro porque esta relacionado con otros registros',
  [HttpStatus.INTERNAL_SERVER_ERROR]:
    'Ocurrio un error inesperado. Por favor, intentelo de nuevo mas tarde',
};

@Catch(HttpException)
export class HttpErrorsException implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorsException.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();

    let message: string | undefined;

    let errors: string[] | undefined;

    const response = exception.getResponse();
    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object') {
      const body = response as Record<string, unknown>;

      if (typeof body.message === 'string') {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        message = (body.message as string[]).join('; ');
      }

      if (Array.isArray(body.errors)) {
        errors = body.errors.map((err) => err?.message as string);
      }
    }

    // Si el mensaje es el generico de NestJS ("Not Found", "Conflict", etc.),
    // lo pisamos con el default del DTO
    const isGeneric = !message || message === GENERIC_HTTP_MESSAGES[status];

    const finalMessage = isGeneric
      ? (DEFAULT_ERROR_MESSAGES[status] ??
        DEFAULT_ERROR_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR])
      : (message as string);

    if (!message) {
      this.logger.warn(
        `HttpException with status ${status} without custom message, using default`,
      );
    }

    return reply.status(status).send({
      status: false,
      data: null,
      message: finalMessage,
      ...(errors ? { errors } : {}),
    });
  }
}
