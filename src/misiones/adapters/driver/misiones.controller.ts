import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';

import {
  buildPaginatedResponse,
  buildResponse,
} from '../../../shared/libs/buildResponse';
import { MISIONES_CORE_PROVIDER } from '../../app/constants';
import type { CreateMissionDto } from '../../app/dto/create-mission.dto';
import {
  changeStatusSchema,
  MissionListResponseDto,
  MissionResponseDto,
} from '../../app/dto/mission.schema';
import type { UpdateMissionDto } from '../../app/dto/update-mission.dto';
import type { MissionStatus } from '../../app/enums';
import type { ForManageMissions } from '../../ports/driven/ForManageMissions';

@Controller('missions')
@ApiCookieAuth()
export class MissionsController {
  constructor(
    @Inject(MISIONES_CORE_PROVIDER)
    private readonly misionesCore: ForManageMissions,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: MissionResponseDto })
  async create(@Body() dto: CreateMissionDto) {
    const mission = await this.misionesCore.createMission(dto);
    return buildResponse(mission, 'Mision creada exitosamente', true);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MissionListResponseDto })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async findAll(
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ) {
    const response = await this.misionesCore.listMissions({ take, skip });
    return buildPaginatedResponse(
      response.missions,
      'Misiones obtenidas exitosamente',
      true,
      {
        limit: response.limit,
        skip: response.skip,
        total: response.total,
      },
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MissionResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const mission = await this.misionesCore.getMission(id);
    return buildResponse(mission, 'Mision obtenida exitosamente', true);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MissionResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMissionDto,
  ) {
    const mission = await this.misionesCore.updateMission(id, dto);
    return buildResponse(mission, 'Mision actualizada exitosamente', true);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MissionResponseDto })
  async activate(@Param('id', ParseIntPipe) id: number) {
    const mission = await this.misionesCore.activateMission(id);
    return buildResponse(mission, 'Mision activada exitosamente', true);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MissionResponseDto })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: MissionStatus },
  ) {
    const mission = await this.misionesCore.changeMissionStatus(
      id,
      body.status,
    );
    return buildResponse(mission, 'Estado actualizado exitosamente', true);
  }
}
