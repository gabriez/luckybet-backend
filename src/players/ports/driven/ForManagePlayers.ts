import { CreatePlayerDto } from '../../app/dto/create-player.dto';
import { PlayerResponse } from '../../app/dto/player.schema';
import { UpdatePlayerDto } from '../../app/dto/update-player.dto';

export interface ForManagePlayers {
	createPlayer(playerData: CreatePlayerDto): Promise<PlayerResponse>;
	findById(id: number): Promise<PlayerResponse>;
	getPlayers(params: {
		take?: number;
		skip?: number;
	}): Promise<{ players: PlayerResponse[]; total: number; limit: number; skip: number }>;
	updatePlayerById(id: number, playerData: UpdatePlayerDto): Promise<PlayerResponse>;
}
