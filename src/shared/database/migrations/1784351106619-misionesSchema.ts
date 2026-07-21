import { MigrationInterface, QueryRunner } from 'typeorm';

export class MisionesSchema1784351106619 implements MigrationInterface {
	name = 'MisionesSchema1784351106619';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// 1. Create enum types
		await queryRunner.query(
			`CREATE TYPE "public"."mission_type_enum" AS ENUM('DAILY', 'WEEKLY', 'FIXED')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."mission_status_enum" AS ENUM('INACTIVE', 'ACTIVE', 'COMPLETED', 'CANCELLED')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."step_type_enum" AS ENUM('IMAGE', 'TEXT')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."step_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."user_mission_status_enum" AS ENUM('IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED')`,
		);

		// 2. Create players table
		await queryRunner.query(
			`CREATE TABLE "players" (
				"id" SERIAL NOT NULL,
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"username" character varying(100) NOT NULL,
				"email" character varying(255) NOT NULL,
				"phone" character varying(20),
				"is_active" boolean NOT NULL DEFAULT true,
				"full_name" character varying(255) NOT NULL,
				"created_by" integer,
				"updated_by" integer,
				CONSTRAINT "UQ_players_username" UNIQUE ("username"),
				CONSTRAINT "UQ_players_email" UNIQUE ("email"),
				CONSTRAINT "PK_players" PRIMARY KEY ("id")
			)`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_players_is_active" ON "players" ("is_active")`,
		);
		await queryRunner.query(
			`ALTER TABLE "players" ADD CONSTRAINT "FK_players_created_by" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "players" ADD CONSTRAINT "FK_players_updated_by" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL`,
		);

		// 3. Create missions table
		await queryRunner.query(
			`CREATE TABLE "missions" (
				"id" SERIAL NOT NULL,
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"title" character varying(200) NOT NULL,
				"description" text,
				"type" "public"."mission_type_enum" NOT NULL,
				"status" "public"."mission_status_enum" NOT NULL DEFAULT 'INACTIVE',
				"chips_amount" integer NOT NULL,
				"bonus" integer,
				"experience_points" integer NOT NULL,
				"image_url" character varying(500),
				"activated_at" TIMESTAMP,
				"expires_at" TIMESTAMP,
				"created_by" integer,
				"updated_by" integer,
				CONSTRAINT "PK_missions" PRIMARY KEY ("id")
			)`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_missions_status" ON "missions" ("status")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_missions_type" ON "missions" ("type")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_missions_activated_at" ON "missions" ("activated_at")`,
		);
		await queryRunner.query(
			`ALTER TABLE "missions" ADD CONSTRAINT "FK_missions_created_by" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "missions" ADD CONSTRAINT "FK_missions_updated_by" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL`,
		);

		// 4. Create mission_steps table
		await queryRunner.query(
			`CREATE TABLE "mission_steps" (
				"id" SERIAL NOT NULL,
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"mission_id" integer NOT NULL,
				"step_order" integer NOT NULL,
				"type" "public"."step_type_enum" NOT NULL,
				"content" text,
				"requires_reviewer" boolean NOT NULL DEFAULT true,
				CONSTRAINT "PK_mission_steps" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_mission_steps_mission_order" UNIQUE ("mission_id", "step_order")
			)`,
		);
		await queryRunner.query(
			`ALTER TABLE "mission_steps" ADD CONSTRAINT "FK_mission_steps_mission" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE`,
		);

		// 5. Create user_missions table
		await queryRunner.query(
			`CREATE TABLE "user_missions" (
				"id" SERIAL NOT NULL,
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"player_id" integer NOT NULL,
				"mission_id" integer NOT NULL,
				"status" "public"."user_mission_status_enum" NOT NULL DEFAULT 'IN_PROGRESS',
				"current_step" integer NOT NULL DEFAULT 1,
				"started_at" TIMESTAMP NOT NULL DEFAULT now(),
				"completed_at" TIMESTAMP,
				CONSTRAINT "PK_user_missions" PRIMARY KEY ("id")
			)`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_user_missions_player_status" ON "user_missions" ("player_id", "status")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_user_missions_mission_id" ON "user_missions" ("mission_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_missions" ADD CONSTRAINT "FK_user_missions_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_missions" ADD CONSTRAINT "FK_user_missions_mission" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE`,
		);

		// 6. Create user_mission_steps table
		await queryRunner.query(
			`CREATE TABLE "user_mission_steps" (
				"id" SERIAL NOT NULL,
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"user_mission_id" integer NOT NULL,
				"mission_step_id" integer NOT NULL,
				"status" "public"."step_status_enum" NOT NULL DEFAULT 'PENDING',
				"submission_text" text,
				"submission_image_url" character varying(500),
				"reviewed_by" integer,
				"reviewed_at" TIMESTAMP,
				"reviewer_notes" text,
				CONSTRAINT "PK_user_mission_steps" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_user_mission_steps_mission_step" UNIQUE ("user_mission_id", "mission_step_id")
			)`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_user_mission_steps_status" ON "user_mission_steps" ("status")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_user_mission_steps_reviewed_by" ON "user_mission_steps" ("reviewed_by")`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_mission_steps" ADD CONSTRAINT "FK_user_mission_steps_user_mission" FOREIGN KEY ("user_mission_id") REFERENCES "user_missions"("id") ON DELETE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_mission_steps" ADD CONSTRAINT "FK_user_mission_steps_mission_step" FOREIGN KEY ("mission_step_id") REFERENCES "mission_steps"("id") ON DELETE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_mission_steps" ADD CONSTRAINT "FK_user_mission_steps_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop tables in reverse order (FK dependencies)
		await queryRunner.query(`DROP TABLE "user_mission_steps"`);
		await queryRunner.query(`DROP TABLE "user_missions"`);
		await queryRunner.query(`DROP TABLE "mission_steps"`);
		await queryRunner.query(`DROP TABLE "missions"`);
		await queryRunner.query(`DROP TABLE "players"`);

		// Drop enum types in reverse order
		await queryRunner.query(`DROP TYPE "public"."user_mission_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."step_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."step_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."mission_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."mission_type_enum"`);
	}
}
