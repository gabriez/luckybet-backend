import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ForDatabaseUsers } from '@/src/users/ports/driver/ForDatabaseUsers';
import type { StorageService, UploadableFile } from '../../shared/storage/storage.port';
import type { ForManageMissions } from '../ports/driven/ForManageMissions';
import type { ForManagePlayerMissions } from '../ports/driven/ForManagePlayerMissions';
import type { ForDatabaseMissions } from '../ports/driver/ForDatabaseMissions';
import type { ForDatabaseUserMissionSteps } from '../ports/driver/ForDatabaseUserMissionSteps';
import type { ForDatabaseUserMissions } from '../ports/driver/ForDatabaseUserMissions';
import type { CreateMissionMultipartDto } from './dto/create-mission.dto';
import type {
	MissionBasic,
	MissionWithSteps,
	StepSubmission,
	UserMissionBasic,
	UserMissionWithSteps,
} from './dto/mission.schema';
import type { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionStatus, StepStatus, StepType, UserMissionStatus } from './enums';

export class MisionesCore implements ForManageMissions, ForManagePlayerMissions {
	constructor(
		private readonly missionRepo: ForDatabaseMissions,
		private readonly userMissionRepo: ForDatabaseUserMissions,
		private readonly stepRepo: ForDatabaseUserMissionSteps,
		private readonly userRepo: ForDatabaseUsers,
		private readonly storage: StorageService,
	) {}

	// ─── Admin: Mission CRUD ────────────────────────────────────

	async createMission(data: CreateMissionMultipartDto): Promise<MissionWithSteps> {
		const { image, ...missionData } = data;
		const imageUrl = await this.storage.uploadImage(image, 'missions');
		try {
			return await this.missionRepo.createMission({ ...missionData, imageUrl });
		} catch (error) {
			// Cleanup: avoid orphan objects in the bucket if the DB write fails
			await this.storage.deleteImage(imageUrl).catch(() => undefined);
			throw error;
		}
	}

	// ─── Admin: Mission images ──────────────────────────────────

	async replaceMissionImage(id: number, file: UploadableFile): Promise<MissionBasic> {
		const mission = await this.missionRepo.findById(id);
		if (!mission) throw new NotFoundException('Mision no encontrada');

		this.validateImageFile(file);
		const newUrl = await this.storage.replaceImage(
			file,
			'missions',
			mission.imageUrl ?? '',
		);

		const updated = await this.missionRepo.updateMission(id, {
			imageUrl: newUrl,
		});
		if (!updated) throw new NotFoundException('Mision no encontrada');
		return updated;
	}

	async deleteMissionImage(id: number): Promise<MissionBasic> {
		const mission = await this.missionRepo.findById(id);
		if (!mission) throw new NotFoundException('Mision no encontrada');

		if (mission.imageUrl) {
			await this.storage.deleteImage(mission.imageUrl);
		}

		const updated = await this.missionRepo.updateMission(id, {
			imageUrl: null,
		});
		if (!updated) throw new NotFoundException('Mision no encontrada');
		return updated;
	}

	private validateImageFile(file: UploadableFile): void {
		if (!file.filename.trim()) {
			throw new BadRequestException('El archivo debe tener un nombre');
		}
		if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
			throw new BadRequestException('Solo se permiten imagenes JPEG o PNG');
		}
		if (file.buffer.length > 5 * 1024 * 1024) {
			throw new BadRequestException('La imagen no puede superar los 5 MiB');
		}
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

	async updateMission(id: number, data: UpdateMissionDto): Promise<MissionBasic> {
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
			throw new BadRequestException('Solo se pueden activar misiones en estado INACTIVE');
		}

		// Row lock handled in repo layer via pessimistic_write
		return this.missionRepo.activateMission(id);
	}

	async changeMissionStatus(id: number, status: MissionStatus): Promise<MissionBasic> {
		const mission = await this.missionRepo.findById(id);
		if (!mission) throw new NotFoundException('Mision no encontrada');

		const validTransitions: Record<string, MissionStatus[]> = {
			[MissionStatus.INACTIVE]: [MissionStatus.ACTIVE, MissionStatus.CANCELLED],
			[MissionStatus.ACTIVE]: [MissionStatus.COMPLETED, MissionStatus.CANCELLED],
		};

		const allowed = validTransitions[mission.status];
		if (!allowed.includes(status)) {
			throw new BadRequestException(
				`Transicion de ${mission.status} a ${status} no valida`,
			);
		}

		if (status === MissionStatus.ACTIVE && mission.status === MissionStatus.INACTIVE) {
			return this.activateMission(id);
		}

		const updated = await this.missionRepo.updateMission(id, { status });
		if (!updated) throw new NotFoundException('Mision no encontrada');
		return updated;
	}

	// ─── Player: Mission Progress ───────────────────────────────

	async startMission(playerId: number, missionId: number): Promise<UserMissionBasic> {
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
			throw new BadRequestException('Ya tienes esta mision en progreso o completada');
		}

		return this.userMissionRepo.createUserMission({ playerId, missionId });
	}

	async submitStep(
		userMissionId: number,
		stepId: number,
		data: { submissionText?: string; submissionImage?: UploadableFile },
	): Promise<StepSubmission> {
		const um = await this.userMissionRepo.findByIdWithSteps(userMissionId);
		if (!um) throw new NotFoundException('Mision de usuario no encontrada');

		const mission = await this.missionRepo.findByIdWithSteps(um.missionId);
		if (!mission) throw new NotFoundException('Mision no encontrada');

		const stepDef = mission.steps.find(s => s.id === stepId);
		if (!stepDef) throw new NotFoundException('Paso no encontrado en la mision');

		// Validate step order
		if (stepDef.stepOrder !== um.currentStep) {
			throw new BadRequestException(`Debes completar el paso ${um.currentStep} primero`);
		}

		let submissionText: string | undefined;
		let submissionImageUrl: string | undefined;

		// Validate and upload content by type
		if (stepDef.type === StepType.IMAGE) {
			if (!data.submissionImage) {
				throw new BadRequestException('El paso de tipo IMAGE requiere una imagen');
			}
			submissionImageUrl = await this.storage.uploadImage(data.submissionImage, 'steps');
		} else {
			if (!data.submissionText) {
				throw new BadRequestException('El paso de tipo TEXT requiere texto');
			}
			if (data.submissionImage) {
				throw new BadRequestException('Este paso no requiere imagen');
			}
			submissionText = data.submissionText;
		}

		return this.stepRepo.createOrUpdateSubmission({
			userMissionId,
			missionStepId: stepId,
			submissionText,
			submissionImageUrl,
		});
	}

	async reviewStep(
		stepId: number,
		status: StepStatus.APPROVED | StepStatus.REJECTED,
		adminId: number,
		notes?: string,
	): Promise<StepSubmission> {
		const admin = await this.userRepo.findByUnique({ id: adminId });

		if (!admin) throw new BadRequestException('Usuario administrador no encontrado');
		if (!admin.isActive) throw new BadRequestException('Usuario administrador no activo');

		const submission = await this.stepRepo.reviewStep(stepId, status, adminId, notes);

		// If approved, advance the user mission
		if (status === StepStatus.APPROVED) {
			const um = await this.userMissionRepo.findById(submission.userMissionId);
			if (!um) throw new NotFoundException('Mision de usuario no encontrada');

			const mission = await this.missionRepo.findByIdWithSteps(um.missionId);
			if (!mission) throw new NotFoundException('Mision no encontrada');

			const totalSteps = mission.steps.length;
			if (um.currentStep >= totalSteps) {
				await this.userMissionRepo.updateStatus(um.id, UserMissionStatus.COMPLETED);
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
		const [missions, total] = await this.userMissionRepo.findByPlayer(playerId, params);
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
