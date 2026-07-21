import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePlayerDto } from '../../app/dto/create-player.dto';
import { UpdatePlayerDto } from '../../app/dto/update-player.dto';
import type {
	PlayerUniqueFields,
	PlayerWithoutAudit,
} from '../../app/dto/player.schema';
import { Player } from '../../app/entities/player.entity';
import { ForDatabasePlayers } from '../../ports/driver/ForDatabasePlayers';

@Injectable()
export class PlayerRepoService implements ForDatabasePlayers {
	constructor(
		@InjectRepository(Player)
		private readonly playerModel: Repository<Player>,
	) {}

	async createPlayer(playerData: CreatePlayerDto): Promise<PlayerWithoutAudit> {
		const player = this.playerModel.create({
			username: playerData.username,
			email: playerData.email,
			phone: playerData.phone,
			fullName: playerData.fullName,
			isActive: playerData.isActive,
			createdById: playerData.createdById,
			updatedById: playerData.updatedById,
		});
		const { isActive, username, email, phone, fullName, id } = await this.playerModel.save(player);
		return {
			isActive,
			username,
			email,
			phone,
			fullName,
			id,
		};
	}

	async updatePlayerById(
		id: number,
		playerData: UpdatePlayerDto,
	): Promise<PlayerWithoutAudit | null> {
		const player = await this.playerModel.findOne({
			where: { id },
			select: {
				id: true,
				username: true,
				email: true,
				phone: true,
				fullName: true,
				isActive: true,
			},
		});
		if (!player) {
			return null;
		}
		Object.assign(player, playerData);
		const { username, email, phone, fullName, isActive } = await this.playerModel.save(player);
		return {
			id,
			username,
			email,
			phone,
			fullName,
			isActive,
		};
	}

	async getPlayers({
		take = 100,
		skip = 0,
	}: {
		take?: number;
		skip?: number;
	}): Promise<[PlayerWithoutAudit[], number]> {
		const [players, count] = await this.playerModel.findAndCount({
			skip,
			take,
			select: { id: true, username: true, email: true, phone: true, fullName: true, isActive: true },
		});

		return [
			players.map(({ id, username, email, phone, fullName, isActive }) => ({
				id,
				username,
				email,
				phone,
				fullName,
				isActive,
			})),
			count,
		];
	}

	async findByUnique(options: PlayerUniqueFields): Promise<PlayerWithoutAudit | null> {
		const result = await this.playerModel.findOne({
			where: options,
			select: { id: true, username: true, email: true, phone: true, fullName: true, isActive: true },
		});

		return result
			? {
				id: result.id,
				username: result.username,
				email: result.email,
				phone: result.phone,
				fullName: result.fullName,
				isActive: result.isActive,
			}
			: null;
	}
}