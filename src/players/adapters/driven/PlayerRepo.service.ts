import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePlayerDto } from '../../app/dto/create-player.dto';
import type {
  PlayerUniqueFields,
  PlayerWithoutAudit,
} from '../../app/dto/player.schema';
import { UpdatePlayerDto } from '../../app/dto/update-player.dto';
import { Player } from '../../app/entities/player.entity';
import { ForDatabasePlayers } from '../../ports/driver/ForDatabasePlayers';

@Injectable()
export class PlayerRepoService implements ForDatabasePlayers {
  constructor(
    @InjectRepository(Player)
    private readonly playerModel: Repository<Player>,
  ) {}

  async createPlayer({
    username,
    phone,
    isActive,
  }: CreatePlayerDto): Promise<PlayerWithoutAudit> {
    const player = this.playerModel.create({
      username,
      isActive,
      phone: phone ?? undefined,
    });
    const saved = await this.playerModel.save(player);
    return {
      id: saved.id,
      username: saved.username,
      phone: saved.phone ?? null,
      isActive: saved.isActive,
    };
  }

  async updatePlayerById(
    id: number,
    playerData: UpdatePlayerDto,
  ): Promise<PlayerWithoutAudit | null> {
    const player = await this.playerModel.findOne({
      where: { id },
    });
    if (!player) {
      return null;
    }
    Object.assign(player, playerData);
    const saved = (await this.playerModel.save(player)) as Player;
    return {
      id: saved.id,
      username: saved.username,
      phone: saved.phone ?? null,
      isActive: saved.isActive,
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
    });

    return [
      players.map(({ id, username, isActive, phone }: Player) => ({
        id,
        username,
        phone: phone ?? null,
        isActive,
      })),
      count,
    ];
  }

  async findByUnique(
    options: PlayerUniqueFields,
  ): Promise<PlayerWithoutAudit | null> {
    const result = await this.playerModel.findOne({
      where: options,
    });

    return result
      ? {
          id: result.id,
          username: result.username,
          phone: result.phone ?? null,
          isActive: result.isActive,
        }
      : null;
  }
}
