import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../shared/entities/base.entity';
import { User } from '../../../users/app/entities/user.entity';

@Entity('players')
export class Player extends BaseEntity {
	@Column({
		type: 'varchar',
		length: 100,
		nullable: false,
		unique: true,
	})
	username!: string;

	@Column({
		type: 'varchar',
		length: 255,
		nullable: false,
		unique: true,
	})
	email!: string;

	@Column({
		type: 'varchar',
		length: 20,
		nullable: true,
	})
	phone?: string;

	@Column({
		type: 'boolean',
		default: true,
		name: 'is_active',
	})
	isActive!: boolean;

	@Column({
		type: 'varchar',
		length: 255,
		nullable: false,
		name: 'full_name',
	})
	fullName!: string;

	@Column({
		type: 'integer',
		nullable: true,
		name: 'created_by',
	})
	createdById?: number;

	@Column({
		type: 'integer',
		nullable: true,
		name: 'updated_by',
	})
	updatedById?: number;

	@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'created_by' })
	createdBy?: User;

	@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'updated_by' })
	updatedBy?: User;
}