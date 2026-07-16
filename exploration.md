## Exploration: misiones-db-schema

### Current State

**Architecture**: Hexagonal (ports & adapters) with NestJS + TypeORM + PostgreSQL + Zod validation.

**Existing Entity Patterns** (`src/shared/entities/base.entity.ts`, `src/users/app/entities/user.entity.ts`):
- `BaseEntity` provides `id` (SERIAL), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP)
- Entities extend `BaseEntity`, use `@Entity('snake_case_table_name')`
- Columns use snake_case DB names (`name: 'is_active'`) with camelCase TS properties
- Enums defined as TS enums, mapped via `@Column({ type: 'enum', enum: EnumName })`
- PostgreSQL enum types created in migrations (`CREATE TYPE ... AS ENUM`)
- `@BeforeInsert`/`@BeforeUpdate` for entity lifecycle hooks
- `select: false` for sensitive fields (passwords)

**Module Registration** (`src/users/users.module.ts`, `src/app.module.ts`):
- `TypeOrmModule.forFeature([Entity])` in module imports
- Ports in `ports/driver` (repo interface) and `ports/driven` (use case interface)
- Adapters in `adapters/driven` (repo impl) and `adapters/driver` (controllers)
- Core business logic in `app/` (e.g., `UsersCore`)

**DTO/Validation** (`src/users/app/dto/user.schema.ts`):
- Zod schemas with Spanish validation messages
- `createZodDto` from `nestjs-zod` for DTO classes
- Separate schemas: base, without password, without id
- Swagger response wrappers: `apiResponseSchema()`, `paginatedResponseSchema()`

**Migrations** (`src/shared/database/migrations/1783351106619-coreSchema.ts`):
- Raw SQL in `up`/`down` methods
- Enum types created explicitly before tables
- Snake_case table/column names

### Affected Areas

| Path | Reason |
|------|--------|
| `src/misiones/` (new module) | New module following hexagonal structure |
| `src/misiones/app/entities/mission.entity.ts` | Main mission entity |
| `src/misiones/app/entities/mission-step.entity.ts` | Mission steps with reviewer verification |
| `src/misiones/app/entities/user-mission.entity.ts` | User mission progress tracking |
| `src/misiones/app/entities/enums.ts` | MissionType, MissionStatus, StepType enums |
| `src/misiones/app/dto/mission.schema.ts` | Zod schemas for validation |
| `src/misiones/adapters/driven/MissionRepo.service.ts` | Repository implementation |
| `src/misiones/ports/driver/ForDatabaseMissions.ts` | Repository interface |
| `src/misiones/ports/driven/ForManageMissions.ts` | Use case interface |
| `src/misiones/app/misionesCore.ts` | Business logic |
| `src/misiones/misiones.module.ts` | Module registration |
| `src/shared/database/migrations/*.ts` | New migration for missions tables |
| `src/app.module.ts` | Register new MisionesModule |

### Approaches

#### 1. **Single Mission Table with Type Discriminator** (Recommended)
```typescript
@Entity('missions')
export class Mission extends BaseEntity {
  @Column({ type: 'enum', enum: MissionType }) type: MissionType; // WEEKLY, DAILY, FIXED
  @Column({ type: 'enum', enum: MissionStatus, default: MissionStatus.INACTIVE }) status: MissionStatus;
  @Column({ type: 'int' }) chipsAmount: number;
  @Column({ type: 'int', nullable: true }) bonus: number;
  @Column({ type: 'text' }) description: string;
  @Column({ type: 'varchar', length: 255 }) title: string;
  @Column({ type: 'int' }) experiencePoints: number;
  @Column({ type: 'varchar', length: 500, nullable: true }) imageUrl: string;
  @Column({ type: 'timestamp', nullable: true }) activatedAt: Date;
  @Column({ type: 'timestamp', nullable: true }) expiresAt: Date; // computed from activatedAt + type duration
  @OneToMany(() => MissionStep, step => step.mission) steps: MissionStep[];
  @OneToMany(() => UserMission, um => um.mission) userMissions: UserMission[];
}
```
- **Pros**: Single table, simple queries, easy polymorphic relations, unified status flow
- **Cons**: `expiresAt` only relevant for WEEKLY/DAILY; nullable for FIXED
- **Effort**: Low

#### 2. **Separate Tables per Mission Type**
- `weekly_missions`, `daily_missions`, `fixed_missions` each with type-specific columns
- **Pros**: Strict schema per type, no nullable columns
- **Cons**: Complex queries (UNIONs for listings), duplicated columns, harder to maintain status transitions
- **Effort**: High

#### 3. **Mission Steps as JSONB vs Separate Table**
**Option A: Separate `mission_steps` table** (Recommended)
```typescript
@Entity('mission_steps')
export class MissionStep extends BaseEntity {
  @ManyToOne(() => Mission, m => m.steps) mission: Mission;
  @Column({ type: 'int' }) order: number;
  @Column({ type: 'enum', enum: StepType }) type: StepType; // IMAGE, TEXT
  @Column({ type: 'text', nullable: true }) content: string; // text description or image URL
  @Column({ type: 'boolean', default: false }) requiresReviewer: boolean;
  @OneToMany(() => UserMissionStep, ums => ums.step) userSteps: UserMissionStep[];
}
```
**Option B: JSONB column on Mission**
- **Pros**: Simpler schema, flexible step structure
- **Cons**: Harder to query/filter steps, no FK integrity, reviewer validation per step is complex
- **Effort**: Low but less maintainable

#### 4. **User Mission Progress Tracking**
```typescript
@Entity('user_missions')
export class UserMission extends BaseEntity {
  @ManyToOne(() => User) user: User;
  @ManyToOne(() => Mission) mission: Mission;
  @Column({ type: 'enum', enum: UserMissionStatus, default: UserMissionStatus.IN_PROGRESS }) status: UserMissionStatus;
  @Column({ type: 'int', default: 0 }) currentStep: number;
  @Column({ type: 'timestamp', nullable: true }) startedAt: Date;
  @Column({ type: 'timestamp', nullable: true }) completedAt: Date;
  @OneToMany(() => UserMissionStep, ums => ums.userMission) steps: UserMissionStep[];
}

@Entity('user_mission_steps')
export class UserMissionStep extends BaseEntity {
  @ManyToOne(() => UserMission) userMission: UserMission;
  @ManyToOne(() => MissionStep) step: MissionStep;
  @Column({ type: 'enum', enum: StepStatus, default: StepStatus.PENDING }) status: StepStatus;
  @Column({ type: 'text', nullable: true }) submissionText: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) submissionImageUrl: string;
  @Column({ type: 'timestamp', nullable: true }) reviewedAt: Date;
  @ManyToOne(() => User, { nullable: true }) reviewedBy: User; // REVIEWER
  @Column({ type: 'text', nullable: true }) reviewerNotes: string;
}
```
- **Pros**: Full audit trail, reviewer accountability, step-level status
- **Cons**: More tables, more joins
- **Effort**: Medium

### Recommendation

**Go with Approach 1 + 3A + 4**: Single `missions` table with type discriminator, separate `mission_steps` table, and `user_missions` + `user_mission_steps` for progress tracking.

**Rationale**:
1. **Single mission table** matches the unified state machine (inactive → active → completed/cancelled) regardless of type. The `expiresAt` column is simply `NULL` for FIXED missions.
2. **Separate steps table** enables FK integrity, ordering, per-step reviewer config, and querying steps independently (e.g., "all steps requiring review").
3. **User mission tables** provide complete audit trail required for the reviewer module and user history module per GUIDE.md.

**Enums to define**:
```typescript
enum MissionType { WEEKLY = 'WEEKLY', DAILY = 'DAILY', FIXED = 'FIXED' }
enum MissionStatus { INACTIVE = 'INACTIVE', ACTIVE = 'ACTIVE', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }
enum StepType { IMAGE = 'IMAGE', TEXT = 'TEXT' }
enum StepStatus { PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
enum UserMissionStatus { IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED', EXPIRED = 'EXPIRED', CANCELLED = 'CANCELLED' }
```

**Duration logic**: Compute `expiresAt` on activation: `activatedAt + (type === WEEKLY ? 7 days : type === DAILY ? 1 day : null)`.

### Risks

1. **Immutable mission content after activation**: Must enforce at application level (core service) — DB cannot easily prevent UPDATE on activated rows. Consider a DB trigger or row-level security policy.

2. **Race condition on mission activation**: Two admins activating simultaneously. Use DB row lock (`SELECT ... FOR UPDATE`) or optimistic locking (`@Version` column on Mission).

3. **Reviewer assignment**: The GUIDE.md mentions reviewers validate submissions. Need to decide: auto-assign, round-robin, or manual claim. Affects `UserMissionStep.reviewedBy` population.

4. **Mission expiration cleanup**: `COMPLETED` status set by cron job or on user access? Recommend cron job + check on read.

5. **Fixed missions one-time completion**: Enforce via unique constraint on `(user_id, mission_id)` where `mission.type = FIXED`.

6. **Image storage**: `imageUrl`/`submissionImageUrl` as VARCHAR assumes external storage (S3, Cloudinary). Confirm storage strategy.

### Ready for Proposal

**Yes** — the exploration provides sufficient context to proceed with the SDD proposal phase. The orchestrator should now invoke `sdd-propose` with the change name `misiones-db-schema` and the context gathered here.