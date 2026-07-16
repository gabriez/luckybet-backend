import cookie from '@fastify/cookie';
import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { AuthModule } from '../src/auth/auth.module';
import {
	DEFAULT_ERROR_MESSAGES,
	HttpErrorsException,
} from '../src/shared/exceptions/httpErrors.exception';
import { TypeORMErrorsException } from '../src/shared/exceptions/typeOrmErrors.exception';
import { validationUserMessages } from '../src/users/app/dto/user.schema';
import { AdminRoles, User } from '../src/users/app/entities/user.entity';
import { UsersModule } from '../src/users/users.module';
import { buildPostgresContainer, stopTestContainer } from './shared/buildPostgresCont';

describe('Auth end to end tests', () => {
	let pgContainer: StartedPostgreSqlContainer;
	let dataSource: DataSource;
	let httpServer: ReturnType<typeof app.getHttpServer>;
	let app: NestFastifyApplication;
	let userRepo: Repository<User>;
	let jwtService: JwtService;
	let user1: User;

	beforeAll(async () => {
		jwtService = new JwtService();

		const [ds, container, options] = await buildPostgresContainer();
		dataSource = ds;
		pgContainer = container;

		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({ cache: true, isGlobal: true }),
				TypeOrmModule.forRoot(options),
				UsersModule,
				AuthModule,
			],
		}).compile();

		app = moduleFixture.createNestApplication<NestFastifyApplication>(
			new FastifyAdapter(),
		);
		await app.register(cookie);

		app.useGlobalPipes(new ZodValidationPipe());

		app.useGlobalFilters(new HttpErrorsException());
		app.useGlobalFilters(new TypeORMErrorsException());

		await app.init();
		await app.getHttpAdapter().getInstance().ready();

		httpServer = app.getHttpServer();

		userRepo = dataSource.getRepository(User);

		user1 = userRepo.create({
			username: 'user1',
			password: '1234567',
			role: AdminRoles.REVIEWER,
			isActive: true,
		});

		await Promise.all([userRepo.save(user1)]);
	}, 120_000);

	afterAll(async () => {
		await stopTestContainer(dataSource, pgContainer);
	});

	afterEach(async () => {
		await userRepo.deleteAll();
	});

	describe('POST /auth/login', () => {
		it('/auth/login 200 OK', async () => {
			const result = await request(httpServer)
				.post('/auth/login')
				.send({ username: user1.username, password: '1234567' })
				.expect(HttpStatus.OK);
			const cookies: string | string[] = result.headers['set-cookie'];

			let accessToken: string | undefined;

			if (Array.isArray(cookies)) {
				accessToken = cookies
					.find((cookie: string) => cookie.includes('accessToken'))
					?.split(';')
					.find((val: string) => val.includes('accessToken'));
			} else {
				cookies.split(';').find((val: string) => val.includes('accessToken'));
			}

			expect(accessToken).not.toBeUndefined();

			const jwtToken = accessToken?.split('=').find(val => !val.includes('accessToken'));
			expect(jwtToken).not.toBeUndefined();

			// biome-ignore lint/style/noNonNullAssertion: we test before that is variable isn't undefined
			const decoded = jwtService.decode(jwtToken!);

			expect(decoded).toMatchObject({
				id: user1.id,
				username: user1.username,
			});

			expect(result.body).toStrictEqual({
				status: true,
				message: 'Inició sesión exitosamente',
				data: {
					accessToken: jwtToken,
				},
			});
		});

		it('/auth/login 400 Bad Request', async () => {
			const expectedErrors = [
				validationUserMessages.username.min,
				validationUserMessages.password.min,
			];

			const response = await request(httpServer)
				.post('/auth/login')
				.send({ username: 'as', password: '567' })
				.expect(HttpStatus.BAD_REQUEST);

			expect(response.body).toHaveProperty('errors');
			expect(response.body.message).toBe('Validation failed');

			for (const err of expectedErrors) {
				expect(response.body.errors).toContainEqual(err);
			}
		});

		it('/auth/login 404 Not Found', async () => {
			const response = await request(httpServer)
				.post('/auth/login')
				.send({ username: 'asdasd', password: '5673124' })
				.expect(HttpStatus.NOT_FOUND);

			expect(response.body.message).toBe(DEFAULT_ERROR_MESSAGES[HttpStatus.NOT_FOUND]);
		});
  });

  describe('POST /auth/logout', () => { })
	describe('POST /auth/me', () => {})
});
