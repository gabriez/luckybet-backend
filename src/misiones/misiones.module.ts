import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserRepoService } from '../users/adapters/driven/UserRepo.service';
import { ForDatabaseUsers } from '../users/ports/driver/ForDatabaseUsers';
import { UsersModule } from '../users/users.module';
import { MissionRepoService } from './adapters/driven/MissionRepo.service';
import { UserMissionRepoService } from './adapters/driven/UserMissionRepo.service';
import { UserMissionStepRepoService } from './adapters/driven/UserMissionStepRepo.service';
import { MissionsController } from './adapters/driver/misiones.controller';
import { PlayerMisionesController } from './adapters/driver/player-misiones.controller';
import { MISIONES_CORE_PROVIDER } from './app/constants';
import { Mission } from './app/entities/mission.entity';
import { MissionStep } from './app/entities/mission-step.entity';
import { UserMission } from './app/entities/user-mission.entity';
import { UserMissionStep } from './app/entities/user-mission-step.entity';
import { MisionesCore } from './app/misionesCore';
import type { ForDatabaseMissions } from './ports/driver/ForDatabaseMissions';
import type { ForDatabaseUserMissionSteps } from './ports/driver/ForDatabaseUserMissionSteps';
import type { ForDatabaseUserMissions } from './ports/driver/ForDatabaseUserMissions';
import { PlayersModule } from '../players/players.module';

@Module({
  imports: [
    UsersModule,
    PlayersModule,
    TypeOrmModule.forFeature([
      Mission,
      MissionStep,
      UserMission,
      UserMissionStep,
    ]),
  ],
  controllers: [MissionsController, PlayerMisionesController],
  providers: [
    MissionRepoService,
    UserMissionRepoService,
    UserMissionStepRepoService,
    {
      provide: MISIONES_CORE_PROVIDER,
      useFactory: (
        missionRepo: ForDatabaseMissions,
        userMissionRepo: ForDatabaseUserMissions,
        stepRepo: ForDatabaseUserMissionSteps,
        userRepo: ForDatabaseUsers,
      ) => new MisionesCore(missionRepo, userMissionRepo, stepRepo, userRepo),
      inject: [
        MissionRepoService,
        UserMissionRepoService,
        UserMissionStepRepoService,
        UserRepoService,
      ],
    },
  ],
})
export class MisionesModule {}
