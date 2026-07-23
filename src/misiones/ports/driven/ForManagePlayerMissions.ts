import type {
  StepSubmission,
  UserMissionBasic,
  UserMissionWithSteps,
} from '../../app/dto/mission.schema';
import { StepStatus } from '../../app/enums';

export interface ForManagePlayerMissions {
  startMission(playerId: number, missionId: number): Promise<UserMissionBasic>;

  submitStep(
    userMissionId: number,
    stepId: number,
    data: { submissionText?: string; submissionImageUrl?: string },
  ): Promise<StepSubmission>;

  reviewStep(
    stepId: number,
    status: StepStatus.APPROVED | StepStatus.REJECTED,
    adminId: number,
    notes?: string,
  ): Promise<StepSubmission>;

  getPlayerMissions(
    playerId: number,
    params: { take?: number; skip?: number },
  ): Promise<{
    missions: UserMissionBasic[];
    total: number;
    limit: number;
    skip: number;
  }>;

  getPlayerMission(id: number): Promise<UserMissionWithSteps>;

  getReviewQueue(): Promise<StepSubmission[]>;
}
