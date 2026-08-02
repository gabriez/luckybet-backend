import { CreatePlayerDto } from '../../app/dto/create-player.dto';
import { PlayerUniqueFields, PlayerWithoutAudit } from '../../app/dto/player.schema';
import { UpdatePlayerDto } from '../../app/dto/update-player.dto';

export interface ForDatabasePlayers {
	createPlayer(playerData: CreatePlayerDto): Promise<PlayerWithoutAudit>;
	findByUnique(options: PlayerUniqueFields): Promise<PlayerWithoutAudit | null>;
	getPlayers(params: {
		take?: number;
		skip?: number;
	}): Promise<[PlayerWithoutAudit[], number]>;
	updatePlayerById(
		id: number,
		playerData: UpdatePlayerDto,
	): Promise<PlayerWithoutAudit | null>;
}
