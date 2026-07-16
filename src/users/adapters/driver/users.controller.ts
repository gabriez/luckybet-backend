import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiQuery } from '@nestjs/swagger';

import {
	buildPaginatedResponse,
	buildResponse,
} from '../../../shared/libs/buildResponse';
import { USER_CORE_PROVIDER } from '../../app/constants';
import { CreateUserDto } from '../../app/dto/create-user.dto';
import { UpdateUserDto } from '../../app/dto/update-user.dto';
import { UserListResponseDto, UserResponseDto } from '../../app/dto/user.schema';
import type { ForManageUsers } from '../../ports/driven/ForManageUsers';

@Controller('users')
export class UsersController {
	constructor(@Inject(USER_CORE_PROVIDER) private readonly usersCore: ForManageUsers) {}

	@Post()
	@ApiCookieAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiCreatedResponse({ type: UserResponseDto })
	async create(@Body() createUserDto: CreateUserDto) {
		const user = await this.usersCore.createUser(createUserDto);

		return buildResponse(user, 'User created successfully', true);
	}

	@Get()
	@ApiCookieAuth()
	@HttpCode(HttpStatus.OK)
	@ApiCreatedResponse({ type: UserListResponseDto })
	@ApiQuery({ name: 'take', required: false, type: Number })
	@ApiQuery({ name: 'skip', required: false, type: Number })
	async findAll(
		@Query('take', new ParseIntPipe({ optional: true })) take?: number,
		@Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
	) {
		const response = await this.usersCore.getUsers({ take, skip });

		return buildPaginatedResponse(
			response.users,
			'Usuarios obtenidos exitosamente',
			true,
			{
				limit: response.limit,
				skip: response.skip,
				total: response.total,
			},
		);
	}

	@Get(':id')
	@HttpCode(HttpStatus.OK)
	@ApiCreatedResponse({ type: UserResponseDto })
	async findOne(@Param('id', new ParseIntPipe({ optional: true })) id: number) {
		const user = await this.usersCore.findById(id);
		return buildResponse(user, 'Usuario obtenido exitosamente', true);
	}

	@Patch(':id')
	@HttpCode(HttpStatus.OK)
	@ApiCreatedResponse({ type: UserResponseDto })
	async update(
		@Param('id', new ParseIntPipe({ optional: true })) id: number,
		@Body() updateUserDto: UpdateUserDto,
	) {
		const user = await this.usersCore.updateUserById(id, updateUserDto);

		return buildResponse(user, 'Usuario editado exitosamente', true);
	}
}
