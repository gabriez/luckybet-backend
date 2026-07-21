import {
	BadRequestException,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';

import { ForManagePlayers } from '../ports/driven/ForManagePlayers';
import { ForDatabasePlayers } from '../ports/driver/ForDatabasePlayers';
import { CreatePlayerDto } from '../app/dto/create-player.dto';
import { UpdatePlayerDto } from '../app/dto/update-player.dto';
import { PlayerWithoutAudit } from '../app/dto/player.schema';

export class PlayersCore implements ForManagePlayers {
	constructor(private readonly playersRepo: ForDatabasePlayers) {}

	async createPlayer(playerData: CreatePlayerDto): Promise<PlayerWithoutAudit> {
		const existingPlayer = await this.playersRepo.findByUnique({
			username: playerData.username,
		});

		if (existingPlayer) {
			throw new BadRequestException('El jugador ya existe');
		}

		return await this.playersRepo.createPlayer(playerData);
	}

	async findById(id: number): Promise<PlayerWithoutAudit> {
		const player = await this.playersRepo.findByUnique({ id });

		if (!player) {
			throw new NotFoundException('Recurso no encontrado');
		}

		return player;
	}

	async getPlayers({ take = 100, skip = 0 }: { take?: number; skip?: number }): Promise<{ players: PlayerWithoutAudit[]; total: number; limit: number; skip: number }> {
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
	): Promise<PlayerWithoutAudit> {
		const player = await this.playersRepo.updatePlayerById(id, playerData);
		if (!player) {
			throw new NotFoundException('Recurso no encontrado');
		}
		return player;
	}
}