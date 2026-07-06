import { HttpStatus } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { validationMessages } from '@/src/users/app/dto/user.schema';
import { HttpErrorsException } from '../src/shared/exceptions/HttpErrors.exception';
import { TypeORMErrorsException } from '../src/shared/exceptions/TypeORMErrors.exception';
import { UsersModule } from '../src/users/users.module';
import {
  buildPostgresContainer,
  stopTestContainer,
} from './shared/buildPostgresCont';

describe('Users (e2e — PostgreSQL real)', () => {
  let app: NestFastifyApplication;
  let pgContainer: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let httpServer: ReturnType<typeof app.getHttpServer>;

  beforeAll(async () => {
    const [ds, container] = await buildPostgresContainer();
    pgContainer = container;
    dataSource = ds;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: pgContainer.getHost(),
          port: pgContainer.getPort(),
          username: 'lucky_user_test',
          password: '1234',
          database: 'lucky_db_test',
          entities: ['src/**/*.entity.ts'],
          synchronize: true,
          logging: false,
        }),
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(new ZodValidationPipe());

    app.useGlobalFilters(new TypeORMErrorsException());
    app.useGlobalFilters(new HttpErrorsException());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    httpServer = app.getHttpServer();
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await stopTestContainer(dataSource, pgContainer);
  }, 60_000);

  // Limpia la tabla entre cada test para que sean independientes
  beforeEach(async () => {
    await dataSource.query('DELETE FROM admin_users');
  });

  // ─── POST /users ─────────────────────────────────────────────

  describe('POST /users', () => {
    it('debería crear un usuario y devolver 201', async () => {
      const response = await request(httpServer)
        .post('/users')
        .send({
          username: 'e2e_user',
          password: 'secret123',
          role: 'REVIEWER',
          isActive: true,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        status: true,
        message: 'User created successfully',
        data: {
          username: 'e2e_user',
          role: 'REVIEWER',
          isActive: true,
        },
      });
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('debería rechazar creación con datos inválidos (400)', async () => {
      const expectedErrors = [
        validationMessages.username.min,
        validationMessages.password.min,
        validationMessages.role.enum,
      ];
      const response = await request(httpServer)
        .post('/users')
        .send({ username: 'ab', password: '123', role: 'INVALID' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.message).toBe('Validation failed');
      for (const err of expectedErrors) {
        expect(response.body.errors).toContainEqual(err);
      }
    });
  });

  // ─── GET /users ──────────────────────────────────────────────

  describe('GET /users', () => {
    const usersLength = 3;
    beforeEach(async () => {
      for (let i = 0; i < usersLength; i++) {
        await request(httpServer)
          .post('/users')
          .send({
            username: `e2e_list_${i}`,
            password: 'pass123',
            role: 'REVIEWER',
          });
      }
    });

    it('debería devolver lista paginada', async () => {
      const response = await request(httpServer)
        .get('/users')
        .query({ take: 2, skip: 0 })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        status: true,
        message: 'Usuarios obtenidos exitosamente',
      });
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
        hasPreviousPage: false,
        hasNextPage: true,
      });
    });

    it('ningún usuario devuelto debería contener password', async () => {
      const response = await request(httpServer)
        .get('/users')
        .query({ take: 10, skip: 0 })
        .expect(HttpStatus.OK);

      for (const user of response.body.data) {
        expect(user).not.toHaveProperty('password');
      }
    });
  });

  // ─── GET /users/:id ──────────────────────────────────────────

  describe('GET /users/:id', () => {
    let createdUserId: number;

    beforeEach(async () => {
      const res = await request(httpServer).post('/users').send({
        username: 'find_by_id',
        password: 'pass123',
        role: 'SUPER_ADMIN',
      });
      createdUserId = res.body.data.id;
    });

    it('debería devolver el usuario por ID', async () => {
      const response = await request(httpServer)
        .get(`/users/${createdUserId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        status: true,
        data: { username: 'find_by_id', role: 'SUPER_ADMIN' },
      });
    });

    it('debería devolver 404 cuando el ID no existe', async () => {
      await request(httpServer)
        .get('/users/99999')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // ─── PATCH /users/:id ────────────────────────────────────────

  describe('PATCH /users/:id', () => {
    let createdUserId: number;

    beforeEach(async () => {
      const res = await request(httpServer).post('/users').send({
        username: 'to_update',
        password: 'pass123',
        role: 'REVIEWER',
      });
      createdUserId = res.body.data.id;
    });

    it('debería actualizar el rol del usuario', async () => {
      const response = await request(httpServer)
        .patch(`/users/${createdUserId}`)
        .send({ role: 'SUPER_ADMIN' })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        status: true,
        data: { username: 'to_update', role: 'SUPER_ADMIN' },
      });
    });

    it('debería rechazar actualización con datos inválidos (400)', async () => {
      const expectedErrors = [
        validationMessages.username.min,
        validationMessages.password.min,
        validationMessages.role.enum,
      ];

      const response = await request(httpServer)
        .patch(`/users/${createdUserId}`)
        .send({ username: 'ab', password: '123', role: 'INVALID' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.message).toBe('Validation failed');
      for (const err of expectedErrors) {
        expect(response.body.errors).toContainEqual(err);
      }
    });

    it('debería devolver 404 al actualizar un ID que no existe', async () => {
      await request(httpServer)
        .patch('/users/99999')
        .send({ role: 'SUPER_ADMIN' })
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
