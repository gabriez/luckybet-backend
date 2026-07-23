import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateMissionDto } from '../../app/dto/create-mission.dto';
import type {
  MissionBasic,
  MissionWithSteps,
} from '../../app/dto/mission.schema';
import { UpdateMissionDto } from '../../app/dto/update-mission.dto';
import { Mission } from '../../app/entities/mission.entity';
import { MissionStatus, MissionType } from '../../app/enums';
import { ForDatabaseMissions } from '../../ports/driver/ForDatabaseMissions';

@Injectable()
export class MissionRepoService implements ForDatabaseMissions {
  constructor(
    @InjectRepository(Mission)
    private readonly missionModel: Repository<Mission>,
  ) {}

  async createMission({
    title,
    description,
    type,
    coinsAmount,
    bonus,
    experiencePoints,
    imageUrl,
  }: CreateMissionDto): Promise<MissionBasic> {
    const mission = this.missionModel.create({
      title,
      description,
      type,
      coinsAmount,
      bonus,
      experiencePoints,
      imageUrl,
    });
    const saved = await this.missionModel.save(mission);
    return this.toBasic(saved);
  }

  async findById(id: number): Promise<MissionBasic | null> {
    const mission = await this.missionModel.findOne({ where: { id } });
    return mission ? this.toBasic(mission) : null;
  }

  async findByIdWithSteps(id: number): Promise<MissionWithSteps | null> {
    const mission = await this.missionModel.findOne({
      where: { id },
      relations: {
        steps: true,
      },
      order: { steps: { stepOrder: 'ASC' } },
    });
    if (!mission) return null;

    const basic = this.toBasic(mission);
    return {
      ...basic,
      steps: (mission.steps ?? []).map((s) => ({
        id: s.id,
        missionId: s.missionId,
        stepOrder: s.stepOrder,
        type: s.type,
        content: s.content,
      })),
    };
  }

  async getMissions({
    take = 100,
    skip = 0,
  }: {
    take?: number;
    skip?: number;
  }): Promise<[MissionBasic[], number]> {
    const [missions, count] = await this.missionModel.findAndCount({
      skip,
      take,
      order: { created_at: 'DESC' },
    });
    return [missions.map((m) => this.toBasic(m)), count];
  }

  async updateMission(
    id: number,
    data: UpdateMissionDto,
  ): Promise<MissionBasic | null> {
    const mission = await this.missionModel.findOne({ where: { id } });
    if (!mission) return null;

    Object.assign(mission, data);
    const saved = await this.missionModel.save(mission);
    return this.toBasic(saved);
  }

  async activateMission(id: number): Promise<MissionBasic> {
    const mission = await this.missionModel.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!mission) {
      throw new Error('Mission not found');
    }

    const now = new Date();
    mission.status = MissionStatus.ACTIVE;
    mission.activatedAt = now;

    if (mission.type === MissionType.WEEKLY) {
      mission.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (mission.type === MissionType.DAILY) {
      mission.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    const saved = await this.missionModel.save(mission);
    return this.toBasic(saved);
  }

  async findActiveMissions(): Promise<MissionBasic[]> {
    const missions = await this.missionModel.find({
      where: { status: MissionStatus.ACTIVE },
    });
    return missions.map((m) => this.toBasic(m));
  }

  private toBasic(mission: Mission): MissionBasic {
    return {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      type: mission.type,
      status: mission.status,
      coinsAmount: mission.coinsAmount,
      bonus: mission.bonus,
      experiencePoints: mission.experiencePoints,
      imageUrl: mission.imageUrl,
      activatedAt: mission.activatedAt,
      expiresAt: mission.expiresAt,
    };
  }
}
