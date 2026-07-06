import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { TypeORMError } from 'typeorm';

@Catch(TypeORMError)
export class TypeORMErrorsException implements ExceptionFilter {
  private readonly logger = new Logger(TypeORMError.name);

  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    this.logger.error(exception.message);

    reply.status(500).send({
      status: false,
      data: null,
      message:
        'Ocurrio un error inesperado. Por favor, intentelo de nuevo mas tarde',
    });
  }
}
