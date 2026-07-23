import { CreateMissionDto } from '../../app/dto/create-mission.dto';
import { UpdateMissionDto } from '../../app/dto/update-mission.dto';
import type { MissionBasic, MissionWithSteps } from '../../app/dto/mission.schema';

export interface ForDatabaseMissions {
	createMission(data: CreateMissionDto): Promise<MissionBasic>;

	findById(id: number): Promise<MissionBasic | null>;

	findByIdWithSteps(id: number): Promise<MissionWithSteps | null>;

	getMissions(params: {
		take?: number;
		skip?: number;
	}): Promise<[MissionBasic[], number]>;

	updateMission(
		id: number,
		data: UpdateMissionDto,
	): Promise<MissionBasic | null>;

	activateMission(id: number): Promise<MissionBasic>;

	findActiveMissions(): Promise<MissionBasic[]>;
}
