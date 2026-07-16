import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ForDatabaseUsers } from '../../users/ports/driver/ForDatabaseUsers';
import { ForAuthentication } from '../ports/driver/ForAuthentication';

export class AuthCore implements ForAuthentication {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userRepo: ForDatabaseUsers,
	) {}

	async login(username: string, password: string): Promise<{ accessToken: string }> {
		const result = await this.userRepo.findToAuth({ username });

		if (result === null) {
			throw new NotFoundException();
		}

		const checkUser = await result.comparePassword(password);
		if (!checkUser) {
			throw new UnauthorizedException('Contraseña inválida');
		}

		const accessToken = this.jwtService.sign({
			id: result.id,
			username: result.username,
		});

		return { accessToken };
	}
}
