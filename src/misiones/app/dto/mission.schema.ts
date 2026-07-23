import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

import {
  apiResponseSchema,
  paginatedResponseSchema,
} from '../../../shared/swagger/apiResponse.schema';
import { MissionStatus, MissionType, StepType } from '../enums';

export const validationMissionMessages = {
  title: {
    string: 'title es obligatorio como string',
    min: 'Minimo 1 caracter para el titulo',
    max: 'Maximo 200 caracteres para el titulo',
    describe: 'Titulo de la mision',
  },
  description: {
    describe: 'Descripcion de la mision',
  },
  status: {
    enum: 'Valores validos: INACTIVE, ACTIVE, COMPLETED, CANCELLED',
    describe: 'Status de la mision'
  },
  type: {
    enum: 'Valores validos: DAILY, WEEKLY, FIXED',
    describe: 'Tipo de mision',
  },
  coinsAmount: {
    int: 'coinsAmount debe ser un numero entero',
    min: 'Minimo 0 chips',
    describe: 'Cantidad de chips de recompensa base',
  },
  bonus: {
    int: 'bonus debe ser un numero entero',
    min: 'Minimo 0 chips de bonus',
    describe: 'Chips de bonus adicional',
  },
  experiencePoints: {
    int: 'experiencePoints debe ser un numero entero',
    min: 'Minimo 0 puntos de experiencia',
    describe: 'Puntos de experiencia',
  },
  imageUrl: {
    url: 'imageUrl debe tener un formato URL valido',
    max: 'Maximo 500 caracteres para la URL',
    describe: 'URL de la imagen de portada',
  },
  stepOrder: {
    int: 'stepOrder debe ser un numero entero',
    min: 'Minimo 1 para el orden del paso',
    describe: 'Orden del paso dentro de la mision',
  },
  content: {
    describe: 'Contenido o instruccion del paso',
  },

  submissionText: {
    describe: 'Texto enviado por el jugador',
  },
  submissionImageUrl: {
    url: 'submissionImageUrl debe tener un formato URL valido',
    max: 'Maximo 500 caracteres para la URL',
    describe: 'URL de la imagen enviada por el jugador',
  },
  reviewerNotes: {
    describe: 'Notas del revisor sobre la submission',
  },
};

// ─── Base Mission Schema ───────────────────────────────────────
export const createMissionSchema = z.object({
  title: z
    .string(validationMissionMessages.title.string)
    .min(1, validationMissionMessages.title.min)
    .max(200, validationMissionMessages.title.max)
    .describe(validationMissionMessages.title.describe),
  description: z
    .string()
    .optional()
    .describe(validationMissionMessages.description.describe),
  type: z
    .enum(MissionType, validationMissionMessages.type.enum)
    .describe(validationMissionMessages.type.describe),
  coinsAmount: z
    .number(validationMissionMessages.coinsAmount.int)
    .int()
    .min(0, validationMissionMessages.coinsAmount.min)
    .describe(validationMissionMessages.coinsAmount.describe),
  bonus: z
    .number(validationMissionMessages.bonus.int)
    .int()
    .min(0, validationMissionMessages.bonus.min)
    .optional()
    .describe(validationMissionMessages.bonus.describe),
  experiencePoints: z
    .number(validationMissionMessages.experiencePoints.int)
    .int()
    .min(0, validationMissionMessages.experiencePoints.min)
    .describe(validationMissionMessages.experiencePoints.describe),
  imageUrl: z
    .url(validationMissionMessages.imageUrl.url)
    .max(500, validationMissionMessages.imageUrl.max)
    .optional()
    .describe(validationMissionMessages.imageUrl.describe),
});

// ─── Mission Step Schema ───────────────────────────────────────
export const createMissionStepSchema = z.object({
  stepOrder: z
    .number(validationMissionMessages.stepOrder.int)
    .int()
    .min(1, validationMissionMessages.stepOrder.min)
    .describe(validationMissionMessages.stepOrder.describe),
  type: z.enum(StepType).describe('Tipo de paso: IMAGE o TEXT'),
  content: z
    .string()
    .optional()
    .describe(validationMissionMessages.content.describe),
});

// ─── Submit Step Schema ────────────────────────────────────────
export const submitStepSchema = z.object({
  submissionText: z
    .string()
    .optional()
    .describe(validationMissionMessages.submissionText.describe),
  submissionImageUrl: z
    .url(validationMissionMessages.submissionImageUrl.url)
    .max(500, validationMissionMessages.submissionImageUrl.max)
    .optional()
    .describe(validationMissionMessages.submissionImageUrl.describe),
});

// ─── Review Step Schema ────────────────────────────────────────
export const reviewStepSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']).describe('Estado de la revision'),
  reviewerNotes: z
    .string()
    .optional()
    .describe(validationMissionMessages.reviewerNotes.describe),
});

// ─── Change Status Schema ──────────────────────────────────────
export const changeStatusSchema = z.object({
  status: z.enum(MissionStatus).describe('Nuevo estado de la mision'),
});

// ─── Response Types ────────────────────────────────────────────
export type MissionBasic = {
  id: number;
  title: string;
  description?: string;
  type: MissionType;
  status: MissionStatus;
  coinsAmount: number;
  bonus?: number;
  experiencePoints: number;
  imageUrl?: string;
  activatedAt?: Date;
  expiresAt?: Date;
};

export type MissionStepBasic = {
  id: number;
  missionId: number;
  stepOrder: number;
  type: StepType;
  content?: string;
};

export type MissionWithSteps = MissionBasic & {
  steps: MissionStepBasic[];
};

export type UserMissionBasic = {
  id: number;
  playerId: number;
  missionId: number;
  status: string;
  currentStep: number;
  startedAt?: Date;
  completedAt?: Date;
};

export type StepSubmission = {
  id: number;
  userMissionId: number;
  missionStepId: number;
  status: string;
  submissionText?: string;
  submissionImageUrl?: string;
  reviewedById?: number;
  reviewedAt?: Date;
  reviewerNotes?: string;
};

export type UserMissionWithSteps = UserMissionBasic & {
  steps: StepSubmission[];
};

// ─── Swagger Response Schemas ──────────────────────────────────
export const MissionResponseSchema = apiResponseSchema(
  createMissionSchema
);

export const MissionListResponseSchema = paginatedResponseSchema(
  createMissionSchema
);

// ─── Response DTOs ─────────────────────────────────────────────
export class MissionResponseDto extends createZodDto(MissionResponseSchema) {}
export class MissionListResponseDto extends createZodDto(
  MissionListResponseSchema,
) {}
export class UserMissionResponseDto extends createZodDto(
  apiResponseSchema(z.object({})),
) {}
export class StepResponseDto extends createZodDto(
  apiResponseSchema(z.object({})),
) {}
