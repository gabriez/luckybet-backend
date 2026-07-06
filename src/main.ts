import cookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { HttpErrorsException } from './shared/exceptions/HttpErrors.exception';
import { TypeORMErrorsException } from './shared/exceptions/TypeORMErrors.exception';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.register(cookie);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1.0');

  app.useGlobalFilters(new TypeORMErrorsException());
  app.useGlobalFilters(new HttpErrorsException());

  app.enableCors({
    origin: configService.get<string>('CORS_ALLOWED', 'http://localhost:4000'),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Luckybet Premios API')
    .setDescription('API de LuckyBet Premios')
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document), {
    swaggerOptions: { tryItOutEnabled: true, withCredentials: true },
  });

  const port = configService.get<string>('PORT', '3000');

  await app.listen({ port: Number(port), host: '0.0.0.0' });
}

bootstrap().catch(handleError);

function handleError(error: unknown) {
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}

process.on('uncaughtException', handleError);
