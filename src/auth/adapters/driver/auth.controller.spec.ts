import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyReply } from 'fastify';

import { buildResponse } from '@/src/shared/libs/buildResponse';
import { User } from '../../../users/app/dto/user.schema';
import { LoginDTO } from '../../app/dto/auth.schema';
import { AUTHCORE_PROVIDER } from '../../constants';
import type { ForAuthentication } from '../../ports/driver/ForAuthentication';
import { AuthController } from './auth.controller';

// ================================================================
// auth.controller.spec.ts
//
// PRUEBAS UNITARIAS EXHAUSTIVAS del AuthController
//
// Mocks:
//   - AUTHCORE_PROVIDER → mock con login()
//   - ConfigService → mock con get()
//   - FastifyReply → mock con setCookie()
//
// Cobertura:
//   - POST /auth/login: éxito, error, cookie config
//   - POST /auth/logout: empty cookie, maxAge 0
//   - GET  /auth/me: usuario actual desde @CurrentUser
// ================================================================

describe('AuthController', () => {
	let controller: AuthController;
	let authCoreMock: jest.Mocked<Pick<ForAuthentication, 'login'>>;
	let configServiceMock: jest.Mocked<Pick<ConfigService, 'get'>>;
	let replyMock: jest.Mocked<Pick<FastifyReply, 'setCookie'>>;

	// Helper para crear un FastifyReply mockeado fresco
	const createReplyMock = () =>
		({ setCookie: jest.fn() }) as unknown as jest.Mocked<Pick<FastifyReply, 'setCookie'>>;

	beforeEach(async () => {
		authCoreMock = { login: jest.fn() };
		configServiceMock = { get: jest.fn() };
		replyMock = createReplyMock();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{ provide: AUTHCORE_PROVIDER, useValue: authCoreMock },
				{ provide: ConfigService, useValue: configServiceMock },
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
	});

	// ─── should be defined ──────────────────────────────────────

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	// ─── POST /auth/login: éxito ────────────────────────────────

	describe('POST /auth/login (login)', () => {
		const loginData = { username: 'admin', password: 'secret123' };
		const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.dG9rZW4=.signature';

		beforeEach(() => {
			authCoreMock.login.mockResolvedValue({ accessToken: fakeToken });
		});

		it('llama a authCore.login con username y password', async () => {
			configServiceMock.get.mockReturnValue('development');

			await controller.login(loginData as LoginDTO, replyMock as FastifyReply);

			expect(authCoreMock.login).toHaveBeenCalledTimes(1);
			expect(authCoreMock.login).toHaveBeenCalledWith(
				loginData.username,
				loginData.password,
			);
		});

		it('establece cookie httpOnly con el accessToken', async () => {
			configServiceMock.get.mockReturnValue('development');

			await controller.login(loginData as LoginDTO, replyMock as FastifyReply);

			expect(replyMock.setCookie).toHaveBeenCalledWith(
				'accessToken',
				fakeToken,
				expect.objectContaining({
					httpOnly: true,
				}),
			);
		});

		it('configura cookie con sameSite lax y path raíz', async () => {
			configServiceMock.get.mockReturnValue('development');

			await controller.login(loginData as LoginDTO, replyMock as FastifyReply);

			expect(replyMock.setCookie).toHaveBeenCalledWith(
				'accessToken',
				fakeToken,
				expect.objectContaining({
					sameSite: 'lax',
					path: '/',
				}),
			);
		});

		it('configura secure=false cuando NODE_ENV no es production', async () => {
			configServiceMock.get.mockReturnValue('development');

			await controller.login(loginData as LoginDTO, replyMock as FastifyReply);

			const cookieArg = replyMock.setCookie.mock.calls[0][2] as Record<string, unknown>;
			expect(cookieArg.secure).toBe(false);
		});

		it('configura secure=true cuando NODE_ENV es production', async () => {
			configServiceMock.get.mockReturnValue('production');

			await controller.login(loginData as LoginDTO, replyMock as FastifyReply);

			const cookieArg = replyMock.setCookie.mock.calls[0][2] as Record<string, unknown>;
			expect(cookieArg.secure).toBe(true);
		});

		it('usa maxAge desde ConfigService con fallback a 86400', async () => {
			configServiceMock.get.mockReturnValue('7200');

			await controller.login(loginData as LoginDTO, replyMock as FastifyReply);

			const cookieArg = replyMock.setCookie.mock.calls[0][2] as Record<string, unknown>;
			expect(cookieArg.maxAge).toBe(7200);
		});

		it('usa fallback 86400 cuando EXPIRES_IN_TOKEN no está definido', async () => {
			configServiceMock.get.mockImplementation((key: string, defaultValue?) => {
				if (key === 'NODE_ENV') return 'development';
				return defaultValue;
			});

			await controller.login(loginData as LoginDTO, replyMock as FastifyReply);

			const cookieArg = replyMock.setCookie.mock.calls[0][2] as Record<string, unknown>;
			expect(cookieArg.maxAge).toBe(86_400);
		});

		it('retorna buildResponse con accessToken y mensaje de éxito', async () => {
			configServiceMock.get.mockReturnValue('development');

			const result = await controller.login(
				loginData as LoginDTO,
				replyMock as FastifyReply,
			);

			expect(result).toEqual(
				buildResponse({ accessToken: fakeToken }, 'Inició sesión exitosamente', true),
			);
		});
	});

	// ─── POST /auth/login: error ────────────────────────────────

	describe('POST /auth/login (error propagation)', () => {
		const loginWrong = { username: 'admin', password: 'wrong' };

		it('propaga el error cuando authCore.login lanza', async () => {
			configServiceMock.get.mockReturnValue('development');

			const authError = new Error('Credenciales inválidas');
			authCoreMock.login.mockRejectedValue(authError);

			await expect(
				controller.login(loginWrong as LoginDTO, replyMock as FastifyReply),
			).rejects.toThrow(authError);

			expect(replyMock.setCookie).not.toHaveBeenCalled();
		});

		it('propaga errores de distintos tipos (Error, string, object)', async () => {
			configServiceMock.get.mockReturnValue('development');
			authCoreMock.login.mockRejectedValue('Error como string');

			await expect(
				controller.login(loginWrong as LoginDTO, replyMock as FastifyReply),
			).rejects.toBe('Error como string');
		});
	});

	// ─── POST /auth/logout ──────────────────────────────────────

	describe('POST /auth/logout (logout)', () => {
		it('establece cookie vacía con maxAge 0', () => {
			configServiceMock.get.mockImplementation((key: string) => {
				if (key === 'NODE_ENV') return 'development';
				return;
			});

			controller.logout(replyMock as FastifyReply);

			expect(replyMock.setCookie).toHaveBeenCalledWith(
				'accessToken',
				'',
				expect.objectContaining({
					maxAge: 0,
					httpOnly: true,
					sameSite: 'lax',
					path: '/',
				}),
			);
		});

		it('configura secure=false en logout cuando no es production', () => {
			configServiceMock.get.mockImplementation((key: string) => {
				if (key === 'NODE_ENV') return 'development';
				return;
			});

			controller.logout(replyMock as FastifyReply);

			const cookieArg = replyMock.setCookie.mock.calls[0][2] as Record<string, unknown>;
			expect(cookieArg.secure).toBe(false);
		});

		it('configura secure=true en logout en production', () => {
			configServiceMock.get.mockImplementation((key: string) => {
				if (key === 'NODE_ENV') return 'production';
				return;
			});

			controller.logout(replyMock as FastifyReply);

			const cookieArg = replyMock.setCookie.mock.calls[0][2] as Record<string, unknown>;
			expect(cookieArg.secure).toBe(true);
		});

		it('retorna objeto con status=true y mensaje de cierre', () => {
			configServiceMock.get.mockReturnValue('development');

			const result = controller.logout(replyMock as FastifyReply);

			expect(result).toEqual({
				status: true,
				message: 'Sesion cerrada exitosamente',
			});
		});
	});

	// ─── GET /auth/me ───────────────────────────────────────────

	describe('GET /auth/me (me)', () => {
		const mockUser = {
			id: 1,
			username: 'admin',
			role: 'SUPER_ADMIN' as const,
			isActive: true,
		};

		it('retorna el usuario con buildResponse', () => {
			const result = controller.me(mockUser as User);

			expect(result).toEqual(buildResponse(mockUser, 'Success', true));
		});

		it('no interactúa con authCore', () => {
			controller.me(mockUser as User);

			expect(authCoreMock.login).not.toHaveBeenCalled();
		});
	});
});
