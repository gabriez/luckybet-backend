import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@/src/shared/entities/base.entity';

export enum AdminRoles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  REVIEWER = 'REVIEWER',
}

@Entity('admin_users')
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    nullable: false,
  })
  username!: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  password!: string;

  @Column({
    type: 'enum',
    enum: AdminRoles,
  })
  role!: AdminRoles;
}
