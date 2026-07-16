import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoreSchema1783351106619 implements MigrationInterface {
	name = 'CoreSchema1783351106619';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."admin_users_role_enum" AS ENUM('SUPER_ADMIN', 'REVIEWER')`,
		);
		await queryRunner.query(
			`CREATE TABLE "admin_users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "username" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."admin_users_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_2873882c38e8c07d98cb64f962d" UNIQUE ("username"), CONSTRAINT "PK_06744d221bb6145dc61e5dc441d" PRIMARY KEY ("id"))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "admin_users"`);
		await queryRunner.query(`DROP TYPE "public"."admin_users_role_enum"`);
	}
}
