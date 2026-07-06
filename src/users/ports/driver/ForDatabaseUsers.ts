import { CreateUserDto } from '../../app/dto/create-user.dto';
import { UpdateUserDto } from '../../app/dto/update-user.dto';
import type {
  UserUniqueFields,
  UserWithMethods,
  UserWithoutPassword,
} from '../../app/dto/user.schema';

export interface ForDatabaseUsers {
  createUser(userData: CreateUserDto): Promise<UserWithoutPassword>;

  findByUnique({
    username,
    id,
  }: UserUniqueFields): Promise<UserWithMethods | null>;

  getUsers(params: {
    take?: number;
    skip?: number;
  }): Promise<[UserWithoutPassword[], number]>;

  updateUserById(
    id: number,
    userData: UpdateUserDto,
  ): Promise<UserWithoutPassword | null>;
}

/*
 What do I want to build for this interface?
 I need to get user by id
 I need to deactive an user by id
*/
