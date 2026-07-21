import {
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';

import { ForManagePlayers } from '../ports/driven/ForManagePlayers';
import { ForDatabasePlayers } from '../ports/driver/ForDatabasePlayers';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerResponse } from './dto/player.schema';

export class PlayersCore implements ForManagePlayers {
	constructor(private readonly playersRepo: ForDatabasePlayers) {}

	async createPlayer(playerData: CreatePlayerDto): Promise<PlayerResponse> {
		const existingPlayer = await this.playersRepo.findByUnique({
			username: playerData.username,
		});

		if (existingPlayer) {
			throw new BadRequestException('El jugador ya existe');
		}

		return await this.playersRepo.createPlayer(playerData);
	}

	async findById(id: number): Promise<PlayerResponse> {
		const player = await this.playersRepo.findByUnique({ id });

		if (!player) {
			throw new NotFoundException('Recurso no encontrado');
		}

		return player;
	}

	async getPlayers({
		take = 100,
		skip = 0,
	}: { take?: number; skip?: number }): Promise<{
		players: PlayerResponse[];
		total: number;
		limit: number;
		skip: number;
	}> {
		const [players, total] = await this.playersRepo.getPlayers({
			take,
			skip,
		});
		return {
			players,
			total,
			limit: take,
			skip,
		};
	}

	async updatePlayerById(
		id: number,
		playerData: UpdatePlayerDto,
	): Promise<PlayerResponse> {
		const player = await this.playersRepo.updatePlayerById(id, playerData);
		if (!player) {
			throw new NotFoundException('Recurso no encontrado');
		}
		return player;
	}
}
