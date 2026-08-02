import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlayerRepoService } from './adapters/driven/PlayerRepo.service';
import { PlayersController } from './adapters/driver/players.controller';
import { PLAYER_CORE_PROVIDER } from './app/constants';
import { Player } from './app/entities/player.entity';
import { PlayersCore } from './app/playersCore';
import { ForDatabasePlayers } from './ports/driver/ForDatabasePlayers';

@Module({
	imports: [TypeOrmModule.forFeature([Player])],
	controllers: [PlayersController],
	providers: [
		PlayerRepoService,
		{
			provide: PLAYER_CORE_PROVIDER,
			useFactory: (repo: ForDatabasePlayers) => new PlayersCore(repo),
			inject: [PlayerRepoService],
		},
	],
	exports: [PlayerRepoService],
})
export class PlayersModule {}
