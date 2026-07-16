import { userSchema, userSchemaWithoutPassword } from './user.schema';

describe('userSchema (Zod)', () => {
	const validUser = {
		username: 'john_doe',
		password: 'securePass1',
		role: 'REVIEWER',
		isActive: true,
	};

	// ─── Valid input ─────────────────────────────────────────────

	describe('valid input', () => {
		it('debería aceptar un usuario válido con todos los campos', () => {
			const result = userSchema.parse(validUser);
			expect(result.username).toBe('john_doe');
			expect(result.role).toBe('REVIEWER');
		});

		it('debería asignar isActive por defecto a true', () => {
			const { isActive, ...withoutActive } = validUser;
			const result = userSchema.parse(withoutActive);
			expect(result.isActive).toBe(true);
		});

		it('debería aceptar rol SUPER_ADMIN', () => {
			const input = { ...validUser, role: 'SUPER_ADMIN' };
			const result = userSchema.parse(input);
			expect(result.role).toBe('SUPER_ADMIN');
		});
	});

	// ─── username ────────────────────────────────────────────────

	describe('username validation', () => {
		it('debería rechazar username menor a 3 caracteres', () => {
			const input = { ...validUser, username: 'ab' };
			const result = userSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('debería rechazar username mayor a 20 caracteres', () => {
			const input = { ...validUser, username: 'a'.repeat(21) };
			const result = userSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('debería aceptar username de exactamente 3 caracteres', () => {
			const input = { ...validUser, username: 'abc' };
			const result = userSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it('debería rechazar username vacío', () => {
			const input = { ...validUser, username: '' };
			const result = userSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	// ─── password ────────────────────────────────────────────────

	describe('password validation', () => {
		it('debería rechazar password menor a 6 caracteres', () => {
			const input = { ...validUser, password: 'abc12' };
			const result = userSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('debería rechazar password mayor a 50 caracteres', () => {
			const input = { ...validUser, password: 'a'.repeat(51) };
			const result = userSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('debería aceptar password de exactamente 6 caracteres', () => {
			const input = { ...validUser, password: 'abc123' };
			const result = userSchema.safeParse(input);
			expect(result.success).toBe(true);
		});
	});

	// ─── role ────────────────────────────────────────────────────

	describe('role validation', () => {
		it('debería rechazar un rol inválido', () => {
			const input = { ...validUser, role: 'ADMIN' };
			const result = userSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('debería rechazar un rol vacío', () => {
			const input = { ...validUser, role: '' };
			const result = userSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	// ─── required fields ─────────────────────────────────────────

	describe('required fields', () => {
		it('debería rechazar si falta username', () => {
			const { username, ...rest } = validUser;
			const result = userSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});

		it('debería rechazar si falta password', () => {
			const { password, ...rest } = validUser;
			const result = userSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});

		it('debería rechazar si falta role', () => {
			const { role, ...rest } = validUser;
			const result = userSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});
	});

	// ─── userSchemaWithoutPassword ───────────────────────────────

	describe('userSchemaWithoutPassword', () => {
		it('no debería incluir el campo password', () => {
			const result = userSchemaWithoutPassword.parse(validUser);
			expect(result).not.toHaveProperty('password');
		});

		it('debería mantener el resto de campos', () => {
			const result = userSchemaWithoutPassword.parse(validUser);
			expect(result).toHaveProperty('username');
			expect(result).toHaveProperty('role');
			expect(result).toHaveProperty('isActive');
		});
	});
});
