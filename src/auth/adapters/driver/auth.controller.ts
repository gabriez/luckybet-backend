// import type { FastifyReply } from 'fastify';
// src/types/fastify-cookie.d.ts
import '@fastify/cookie';

import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
	Res,
	UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import { buildResponse } from '../../../shared/libs/buildResponse';
import { type User, UserResponseDto } from '../../../users/app/dto/user.schema';
import { LoginDTO, LoginResponseDTO } from '../../app/dto/auth.schema';
import { JwtGuard } from '../../app/guards/jwt.guard';
import { AUTHCORE_PROVIDER } from '../../constants';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import type { ForAuthentication } from '../../ports/driver/ForAuthentication';

@Controller('auth')
export class AuthController {
	constructor(
		@Inject(AUTHCORE_PROVIDER) private readonly authCore: ForAuthentication,
		private readonly configService: ConfigService,
	) {}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({ type: LoginResponseDTO })
	async login(@Body() login: LoginDTO, @Res({ passthrough: true }) res: FastifyReply) {
		const result = await this.authCore.login(login.username, login.password);

		res.setCookie('accessToken', result.accessToken, {
			httpOnly: true,
			sameSite: 'lax',
			secure: this.configService.get('NODE_ENV') === 'production',
			path: '/',
			maxAge: Number(this.configService.get('EXPIRES_IN_TOKEN', '86400')),
		});

		return buildResponse(result, 'Inició sesión exitosamente', true);
	}

	@Post('logout')
	@UseGuards(JwtGuard)
	@HttpCode(HttpStatus.OK)
	logout(@Res({ passthrough: true }) reply: FastifyReply) {
		reply.setCookie('accessToken', '', {
			httpOnly: true,
			secure: this.configService.get('NODE_ENV') === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: 0,
		});
		return { status: true, message: 'Sesion cerrada exitosamente' };
	}

	@Get('me')
	@UseGuards(JwtGuard)
	@ApiOkResponse({ type: UserResponseDto })
	me(@CurrentUser() user: User) {
		return buildResponse(user, 'Success', true);
	}
}
