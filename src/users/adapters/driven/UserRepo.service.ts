import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../app/dto/create-user.dto';
import { UpdateUserDto } from '../../app/dto/update-user.dto';
import type {
  UserUniqueFields,
  UserWithMethods,
  UserWithoutPassword,
} from '../../app/dto/user.schema';
import { User } from '../../app/entities/user.entity';
import { ForDatabaseUsers } from '../../ports/driver/ForDatabaseUsers';

@Injectable()
export class UserRepoService implements ForDatabaseUsers {
  constructor(
    @InjectRepository(User)
    private readonly userModel: Repository<User>,
  ) {}

  async createUser(userData: CreateUserDto): Promise<UserWithoutPassword> {
    const user = this.userModel.create({
      username: userData.username,
      password: userData.password,
      role: userData.role,
      isActive: userData.isActive,
    });
    const { isActive, role, id, username } = await this.userModel.save(user);
    return {
      isActive,
      role,
      id,
      username,
    };
  }

  async updateUserById(
    id: number,
    userData: UpdateUserDto,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.userModel.findOne({
      where: { id },
      select: {
        id: true,
        username: true,
        password: true,
        isActive: true,
        role: true,
      },
    });
    if (!user) {
      return null;
    }
    Object.assign(user, userData);
    const { username, role, isActive } = await this.userModel.save(user);
    return {
      id,
      username,
      role,
      isActive,
    };
  }

  async getUsers({
    take = 100,
    skip = 0,
  }: {
    take?: number;
    skip?: number;
  }): Promise<[UserWithoutPassword[], number]> {
    const [users, count] = await this.userModel.findAndCount({
      skip,
      take,
      select: { id: true, role: true, username: true, isActive: true },
    });

    return [
      users.map(({ id, role, username, isActive }) => ({
        id,
        role,
        username,
        isActive,
      })),
      count,
    ];
  }

  async findByUnique(
    options: UserUniqueFields,
  ): Promise<UserWithMethods | null> {
    const result = await this.userModel.findOne({
      where: options,
      select: { id: true, role: true, username: true, isActive: true },
    });

    return result
      ? {
          id: result.id,
          comparePassword: result.comparePassword,
          isActive: result.isActive,
          role: result.role,
          username: result.username,
        }
      : null;
  }
}
