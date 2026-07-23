import {
	BadRequestException,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { ForManageUsers } from '../ports/driven/ForManageUsers';
import { ForDatabaseUsers } from '../ports/driver/ForDatabaseUsers';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserWithoutPassword } from './dto/user.schema';

export class UsersCore implements ForManageUsers {
	constructor(private readonly usersRepo: ForDatabaseUsers) {}

	async createUser(userData: CreateUserDto): Promise<UserWithoutPassword> {
		const existingUser = await this.usersRepo.findByUnique({
			username: userData.username,
		});

		if (existingUser) {
			throw new BadRequestException('El usuario ya existe');
		}

		return await this.usersRepo.createUser(userData);
	}

	async findById(id: number): Promise<UserWithoutPassword> {
		const user = await this.usersRepo.findByUnique({ id });

		if (!user) {
			throw new NotFoundException('Recurso no encontrado');
		}

		return user;
	}

	async getUsers({ take = 100, skip = 0 }: { take?: number; skip?: number }): Promise<{
		users: UserWithoutPassword[];
		total: number;
		limit: number;
		skip: number;
	}> {
		const [users, total] = await this.usersRepo.getUsers({
			take,
			skip,
		});
		return {
			users,
			total,
			limit: take,
			skip,
		};
	}

	async updateUserById(
		id: number,
		userData: UpdateUserDto,
	): Promise<UserWithoutPassword> {
		const user = await this.usersRepo.updateUserById(id, userData);
		if (!user) {
			throw new NotFoundException('Recurso no encontrado');
		}
		return user;
	}
}
