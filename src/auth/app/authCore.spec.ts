import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserWithMethods } from '@/src/users/app/dto/user.schema';
import { ForDatabaseUsers } from '@/src/users/ports/driver/ForDatabaseUsers';
import { AuthCore } from './authCore';

describe('Auth Core tests', () => {
	let jwtServiceMock: jest.Mocked<Pick<JwtService, 'sign'>>;
	let mockUserRepo: jest.Mocked<ForDatabaseUsers>;
	let authCore: AuthCore;
	const user = {
		id: 1,
		username: 'user',
		comparePassword: jest.fn(),
	};

	beforeAll(() => {
		jwtServiceMock = {
			sign: jest.fn(),
		};
		mockUserRepo = {
			findToAuth: jest.fn(),
			createUser: jest.fn(),
			findByUnique: jest.fn(),
			getUsers: jest.fn(),
			updateUserById: jest.fn(),
		};
		authCore = new AuthCore(
			jwtServiceMock as unknown as JwtService,
			mockUserRepo as ForDatabaseUsers,
		);
	});

	describe('Auth core sucess', () => {
		it('AuthCore is defined', () => {
			expect(authCore).toBeDefined();
		});

		it('AuthCore should return access token', async () => {
			jwtServiceMock.sign.mockReturnValue('1234');
			user.comparePassword.mockReturnValue(true);
			mockUserRepo.findToAuth.mockResolvedValue(user as unknown as UserWithMethods);

			const result = await authCore.login(user.username, '123');

			expect(mockUserRepo.findToAuth).toHaveBeenCalledWith({
				username: user.username,
			});
			expect(jwtServiceMock.sign).toHaveBeenCalledWith({
				username: user.username,
				id: user.id,
			});
			expect(result).toStrictEqual({
				accessToken: '1234',
			});
		});
	});

	describe('Auth core fail', () => {
		it('Auth core should throw NotFoundException', async () => {
			mockUserRepo.findToAuth.mockResolvedValue(null);

			await expect(authCore.login('none', '123')).rejects.toThrow(NotFoundException);
		});

		it('Auth core should throw UnauthorizedException', async () => {
			user.comparePassword.mockReturnValue(false);
			mockUserRepo.findToAuth.mockResolvedValue(user as unknown as UserWithMethods);
			await expect(authCore.login(user.username, '123')).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('Auth core should throw error', async () => {
			const err = new Error('User not found');

			mockUserRepo.findToAuth.mockRejectedValue(err);
			await expect(authCore.login(user.username, '123')).rejects.toThrow(err);
		});
	});
});
