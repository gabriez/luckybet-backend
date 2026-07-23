import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ForDatabaseUsers } from '@/src/users/ports/driver/ForDatabaseUsers';
import type { ForManageMissions } from '../ports/driven/ForManageMissions';
import type { ForManagePlayerMissions } from '../ports/driven/ForManagePlayerMissions';
import type { ForDatabaseMissions } from '../ports/driver/ForDatabaseMissions';
import type { ForDatabaseUserMissionSteps } from '../ports/driver/ForDatabaseUserMissionSteps';
import type { ForDatabaseUserMissions } from '../ports/driver/ForDatabaseUserMissions';
import type { CreateMissionDto } from './dto/create-mission.dto';
import type {
  MissionBasic,
  MissionWithSteps,
  StepSubmission,
  UserMissionBasic,
  UserMissionWithSteps,
} from './dto/mission.schema';
import type { UpdateMissionDto } from './dto/update-mission.dto';
import {
  MissionStatus,
  StepStatus,
  StepType,
  UserMissionStatus,
} from './enums';

export class MisionesCore
  implements ForManageMissions, ForManagePlayerMissions
{
  constructor(
    private readonly missionRepo: ForDatabaseMissions,
    private readonly userMissionRepo: ForDatabaseUserMissions,
    private readonly stepRepo: ForDatabaseUserMissionSteps,
    private readonly userRepo: ForDatabaseUsers,
  ) {}

  // ─── Admin: Mission CRUD ────────────────────────────────────

  async createMission(data: CreateMissionDto): Promise<MissionBasic> {
    return await this.missionRepo.createMission(data);
  }

  async getMission(id: number): Promise<MissionWithSteps> {
    const mission = await this.missionRepo.findByIdWithSteps(id);
    if (!mission) throw new NotFoundException('Mision no encontrada');
    return mission;
  }

  async listMissions(params: { take?: number; skip?: number }): Promise<{
    missions: MissionBasic[];
    total: number;
    limit: number;
    skip: number;
  }> {
    const [missions, total] = await this.missionRepo.getMissions(params);
    return {
      missions,
      total,
      limit: params.take ?? 100,
      skip: params.skip ?? 0,
    };
  }

  async updateMission(
    id: number,
    data: UpdateMissionDto,
  ): Promise<MissionBasic> {
    const mission = await this.missionRepo.findById(id);
    if (!mission) throw new NotFoundException('Mision no encontrada');

    // Immutability rule: active missions content cannot change
    if (mission.status === MissionStatus.ACTIVE) {
      throw new BadRequestException(
        'El contenido de la mision es inmutable despues de activarse',
      );
    }

    const updated = await this.missionRepo.updateMission(id, data);
    if (!updated) throw new NotFoundException('Mision no encontrada');
    return updated;
  }

  async activateMission(id: number): Promise<MissionBasic> {
    const mission = await this.missionRepo.findById(id);
    if (!mission) throw new NotFoundException('Mision no encontrada');

    if (mission.status !== MissionStatus.INACTIVE) {
      throw new BadRequestException(
        'Solo se pueden activar misiones en estado INACTIVE',
      );
    }

    // Row lock handled in repo layer via pessimistic_write
    return this.missionRepo.activateMission(id);
  }

  async changeMissionStatus(
    id: number,
    status: MissionStatus,
  ): Promise<MissionBasic> {
    const mission = await this.missionRepo.findById(id);
    if (!mission) throw new NotFoundException('Mision no encontrada');

    const validTransitions: Record<string, MissionStatus[]> = {
      [MissionStatus.INACTIVE]: [MissionStatus.ACTIVE, MissionStatus.CANCELLED],
      [MissionStatus.ACTIVE]: [
        MissionStatus.COMPLETED,
        MissionStatus.CANCELLED,
      ],
    };

    const allowed = validTransitions[mission.status];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Transicion de ${mission.status} a ${status} no valida`,
      );
    }

    if (
      status === MissionStatus.ACTIVE &&
      mission.status === MissionStatus.INACTIVE
    ) {
      return this.activateMission(id);
    }

    const updated = await this.missionRepo.updateMission(id, { status });
    if (!updated) throw new NotFoundException('Mision no encontrada');
    return updated;
  }

  // ─── Player: Mission Progress ───────────────────────────────

  async startMission(
    playerId: number,
    missionId: number,
  ): Promise<UserMissionBasic> {
    const mission = await this.missionRepo.findById(missionId);
    if (!mission) throw new NotFoundException('Mision no encontrada');

    if (mission.status !== MissionStatus.ACTIVE) {
      throw new BadRequestException('La mision no esta activa');
    }

    if (mission.expiresAt && new Date() > mission.expiresAt) {
      throw new BadRequestException('La mision ha expirado');
    }

    const existing = await this.userMissionRepo.findByPlayerAndMission(
      playerId,
      missionId,
    );
    if (existing) {
      throw new BadRequestException(
        'Ya tienes esta mision en progreso o completada',
      );
    }

    return this.userMissionRepo.createUserMission({ playerId, missionId });
  }

  async submitStep(
    userMissionId: number,
    stepId: number,
    data: { submissionText?: string; submissionImageUrl?: string },
  ): Promise<StepSubmission> {
    const um = await this.userMissionRepo.findByIdWithSteps(userMissionId);
    if (!um) throw new NotFoundException('Mision de usuario no encontrada');

    const mission = await this.missionRepo.findByIdWithSteps(um.missionId);
    if (!mission) throw new NotFoundException('Mision no encontrada');

    const stepDef = mission.steps.find((s) => s.id === stepId);
    if (!stepDef)
      throw new NotFoundException('Paso no encontrado en la mision');

    // Validate step order
    if (stepDef.stepOrder !== um.currentStep) {
      throw new BadRequestException(
        `Debes completar el paso ${um.currentStep} primero`,
      );
    }

    // Validate content by type
    if (stepDef.type === StepType.IMAGE && !data.submissionImageUrl) {
      throw new BadRequestException(
        'El paso de tipo IMAGE requiere una imagen',
      );
    }
    if (stepDef.type === StepType.TEXT && !data.submissionText) {
      throw new BadRequestException('El paso de tipo TEXT requiere texto');
    }

    return this.stepRepo.createOrUpdateSubmission({
      userMissionId,
      missionStepId: stepId,
      submissionText: data.submissionText,
      submissionImageUrl: data.submissionImageUrl,
    });
  }

  async reviewStep(
    stepId: number,
    status: StepStatus.APPROVED | StepStatus.REJECTED,
    adminId: number,
    notes?: string,
  ): Promise<StepSubmission> {
    const admin = await this.userRepo.findByUnique({ id: adminId });

    if (!admin) throw new BadRequestException("Usuario administrador no encontrado");
    if (!admin.isActive) throw new BadRequestException("Usuario administrador no activo");

    const submission = await this.stepRepo.reviewStep(
      stepId,
      status,
      adminId,
      notes,
    );

    // If approved, advance the user mission
    if (status === StepStatus.APPROVED) {
      const um = await this.userMissionRepo.findById(submission.userMissionId);
      if (!um) throw new NotFoundException('Mision de usuario no encontrada');

      const mission = await this.missionRepo.findByIdWithSteps(um.missionId);
      if (!mission) throw new NotFoundException('Mision no encontrada');

      const totalSteps = mission.steps.length;
      if (um.currentStep >= totalSteps) {
        await this.userMissionRepo.updateStatus(
          um.id,
          UserMissionStatus.COMPLETED,
        );
      } else {
        await this.userMissionRepo.updateCurrentStep(um.id, um.currentStep + 1);
      }
    }

    return submission;
  }

  async getPlayerMissions(
    playerId: number,
    params: { take?: number; skip?: number },
  ): Promise<{
    missions: UserMissionBasic[];
    total: number;
    limit: number;
    skip: number;
  }> {
    const [missions, total] = await this.userMissionRepo.findByPlayer(
      playerId,
      params,
    );
    return {
      missions,
      total,
      limit: params.take ?? 100,
      skip: params.skip ?? 0,
    };
  }

  async getPlayerMission(id: number): Promise<UserMissionWithSteps> {
    const um = await this.userMissionRepo.findByIdWithSteps(id);
    if (!um) throw new NotFoundException('Mision de usuario no encontrada');
    return um;
  }

  async getReviewQueue(): Promise<StepSubmission[]> {
    return await this.stepRepo.findPendingReviews();
  }
}
