import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRepoService } from '../../../users/adapters/driven/UserRepo.service';

interface JwtPayload {
	id: number;
	username: string;
}

interface RequestWithCookies {
	cookies?: Record<string, string>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		configService: ConfigService,
		private readonly userRepo: UserRepoService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				ExtractJwt.fromAuthHeaderAsBearerToken(),
				(request: RequestWithCookies) => request.cookies?.accessToken ?? null,
			]),
			ignoreExpiration: false,
			secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
		});
	}

	async validate({ username, id }: JwtPayload) {
		if (typeof username !== 'string' || typeof id !== 'number') {
			throw new UnauthorizedException('No se pudo validar el token de autenticacion');
		}

		const user = await this.userRepo.findByUnique({ id });
		if (!user || (user?.isActive && !user.isActive)) {
			throw new UnauthorizedException('Usuario no encontrado o inactivo');
		}

		return user;
	}
}
