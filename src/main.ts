import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(cookieParser());
	await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch(handleError);

function handleError(error: unknown) {
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(1);
}

process.on('uncaughtException', handleError);
