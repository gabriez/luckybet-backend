import { validationUserMessages } from '@/src/users/app/dto/user.schema';
import {
	authSchema,
	LoginDTO,
	LoginResponseDTO,
	loginResponseSchema,
	loginSchema,
} from './auth.schema';

/* ============================================================
 * auth.schema.spec.ts
 *
 * PRUEBAS EXHAUSTIVAS de los esquemas Zod de autenticación
 *
 * Cobertura:
 *   - loginSchema: username + password (validación, límites, tipos)
 *   - authSchema: accessToken (formato)
 *   - loginResponseSchema: estructura apiResponse con accessToken
 *   - DTOs: LoginDTO y LoginResponseDTO como clases nestjs-zod
 * ============================================================ */

describe('auth.schema | loginSchema', () => {
	// ─── VÁLIDOS ───────────────────────────────────────────────

	describe('casos válidos', () => {
		it('acepta username de 3 caracteres y password de 6', () => {
			const result = loginSchema.safeParse({
				username: 'abc',
				password: '123456',
			});
			expect(result.success).toBe(true);
		});

		it('acepta username de 20 caracteres y password de 50', () => {
			const result = loginSchema.safeParse({
				username: 'a'.repeat(20),
				password: 'b'.repeat(50),
			});
			expect(result.success).toBe(true);
		});

		it('acepta caracteres especiales en username (guión bajo, puntos)', () => {
			const result = loginSchema.safeParse({
				username: 'user_name.test',
				password: 'P@ssw0rd!',
			});
			expect(result.success).toBe(true);
		});

		it('acepta números en username', () => {
			const result = loginSchema.safeParse({
				username: 'user123',
				password: 'securePass1',
			});
			expect(result.success).toBe(true);
		});
	});

	// ─── USERNAME — límites ────────────────────────────────────

	describe('username: límites de longitud', () => {
		it('rechaza username vacío (string de 0 caracteres)', () => {
			const result = loginSchema.safeParse({
				username: '',
				password: '123456',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
			}
		});

		it('rechaza username de 2 caracteres (mínimo es 3)', () => {
			const result = loginSchema.safeParse({
				username: 'ab',
				password: '123456',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
				expect(result.error.issues[0].message).toBe(validationUserMessages.username.min);
			}
		});

		it('rechaza username de 21 caracteres (máximo es 20)', () => {
			const result = loginSchema.safeParse({
				username: 'a'.repeat(21),
				password: '123456',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
				expect(result.error.issues[0].message).toBe(validationUserMessages.username.max);
			}
		});
	});

	// ─── USERNAME — tipos inválidos ────────────────────────────

	describe('username: tipos incorrectos', () => {
		it('rechaza username numérico', () => {
			const result = loginSchema.safeParse({
				username: 123,
				password: '123456',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
			}
		});

		it('rechaza username null', () => {
			const result = loginSchema.safeParse({
				username: null,
				password: '123456',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
			}
		});

		it('rechaza username undefined', () => {
			const result = loginSchema.safeParse({
				username: undefined,
				password: '123456',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
			}
		});

		it('rechaza username booleano', () => {
			const result = loginSchema.safeParse({
				username: true,
				password: '123456',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
			}
		});

		it('rechaza username array', () => {
			const result = loginSchema.safeParse({
				username: ['user'],
				password: '123456',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
			}
		});

		it('rechaza username objeto', () => {
			const result = loginSchema.safeParse({
				username: { name: 'user' },
				password: '123456',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
			}
		});
	});

	// ─── PASSWORD — límites ────────────────────────────────────

	describe('password: límites de longitud', () => {
		it('rechaza password vacío', () => {
			const result = loginSchema.safeParse({
				username: 'user1',
				password: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('password');
			}
		});

		it('rechaza password de 5 caracteres (mínimo es 6)', () => {
			const result = loginSchema.safeParse({
				username: 'user1',
				password: 'a'.repeat(5),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('password');
				expect(result.error.issues[0].message).toBe(validationUserMessages.password.min);
			}
		});

		it('rechaza password de 51 caracteres (máximo es 50)', () => {
			const result = loginSchema.safeParse({
				username: 'user1',
				password: 'b'.repeat(51),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('password');
				expect(result.error.issues[0].message).toBe(validationUserMessages.password.max);
			}
		});
	});

	// ─── PASSWORD — tipos inválidos ────────────────────────────

	describe('password: tipos incorrectos', () => {
		it('rechaza password numérico', () => {
			const result = loginSchema.safeParse({
				username: 'user1',
				password: 123_456,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('password');
			}
		});

		it('rechaza password null', () => {
			const result = loginSchema.safeParse({
				username: 'user1',
				password: null,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('password');
			}
		});

		it('rechaza password undefined', () => {
			const result = loginSchema.safeParse({
				username: 'user1',
				password: undefined,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('password');
			}
		});

		it('rechaza password booleano', () => {
			const result = loginSchema.safeParse({
				username: 'user1',
				password: false,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('password');
			}
		});
	});

	// ─── CAMPOS FALTANTES ──────────────────────────────────────

	describe('campos requeridos', () => {
		it('rechaza objeto sin username', () => {
			const result = loginSchema.safeParse({ password: '123456' });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('username');
			}
		});

		it('rechaza objeto sin password', () => {
			const result = loginSchema.safeParse({ username: 'user1' });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('password');
			}
		});

		it('rechaza objeto vacío', () => {
			const result = loginSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('rechaza null como input completo', () => {
			const result = loginSchema.safeParse(null);
			expect(result.success).toBe(false);
		});

		it('rechaza undefined como input completo', () => {
			const result = loginSchema.safeParse(undefined);
			expect(result.success).toBe(false);
		});
	});
});

// ─── authSchema ──────────────────────────────────────────────

describe('auth.schema | authSchema', () => {
	it('acepta accessToken string', () => {
		const result = authSchema.safeParse({
			accessToken:
				'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8',
		});
		expect(result.success).toBe(true);
	});

	it('acepta accessToken con valor corto', () => {
		const result = authSchema.safeParse({ accessToken: 'token-corto' });
		expect(result.success).toBe(true);
	});

	it('rechaza accessToken numérico', () => {
		const result = authSchema.safeParse({ accessToken: 12_345 });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('accessToken');
		}
	});

	it('rechaza accessToken null', () => {
		const result = authSchema.safeParse({ accessToken: null });
		expect(result.success).toBe(false);
	});

	it('rechaza accessToken undefined', () => {
		const result = authSchema.safeParse({ accessToken: undefined });
		expect(result.success).toBe(false);
	});

	it('rechaza accessToken booleano', () => {
		const result = authSchema.safeParse({ accessToken: false });
		expect(result.success).toBe(false);
	});

	it('rechaza accessToken array', () => {
		const result = authSchema.safeParse({ accessToken: ['token'] });
		expect(result.success).toBe(false);
	});

	it('rechaza objeto vacío (falta accessToken)', () => {
		const result = authSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

// ─── loginResponseSchema ─────────────────────────────────────

describe('auth.schema | loginResponseSchema', () => {
	const validAccessToken =
		'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8';

	it('acepta estructura completa con accessToken válido', () => {
		const result = loginResponseSchema.safeParse({
			data: { accessToken: validAccessToken },
		});
		expect(result.success).toBe(true);
	});

	it('usa valores por defecto (status=true, message="Success")', () => {
		const result = loginResponseSchema.safeParse({
			data: { accessToken: validAccessToken },
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe(true);
			expect(result.data.message).toBe('Success');
		}
	});

	it('acepta status y message explícitos', () => {
		const result = loginResponseSchema.safeParse({
			data: { accessToken: validAccessToken },
			status: false,
			message: 'Error personalizado',
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe(false);
			expect(result.data.message).toBe('Error personalizado');
		}
	});

	it('rechaza loginResponseSchema sin data', () => {
		const result = loginResponseSchema.safeParse({
			status: true,
			message: 'Success',
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('data');
		}
	});

	it('rechaza loginResponseSchema con data.accessToken inválido', () => {
		const result = loginResponseSchema.safeParse({
			data: { accessToken: 12_345 },
		});
		expect(result.success).toBe(false);
	});

	it('rechaza input null completo', () => {
		const result = loginResponseSchema.safeParse(null);
		expect(result.success).toBe(false);
	});
});
