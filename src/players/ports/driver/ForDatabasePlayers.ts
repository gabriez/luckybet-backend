import { CreatePlayerDto } from '../../app/dto/create-player.dto';
import { UpdatePlayerDto } from '../../app/dto/update-player.dto';
import {
	PlayerWithoutAudit,
	PlayerUniqueFields,
} from '../../app/dto/player.schema';

export interface ForDatabasePlayers {
	createPlayer(playerData: CreatePlayerDto): Promise<PlayerWithoutAudit>;
	findByUnique(options: PlayerUniqueFields): Promise<PlayerWithoutAudit | null>;
	getPlayers(params: { take?: number; skip?: number }): Promise<[PlayerWithoutAudit[], number]>;
	updatePlayerById(id: number, playerData: UpdatePlayerDto): Promise<PlayerWithoutAudit | null>;
}