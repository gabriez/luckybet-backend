import { CreateUserDto } from '../../app/dto/create-user.dto';
import { UpdateUserDto } from '../../app/dto/update-user.dto';
import { UserWithoutPassword } from '../../app/dto/user.schema';

export interface ForManageUsers {
  createUser(userData: CreateUserDto): Promise<UserWithoutPassword>;

  findById(id: number): Promise<UserWithoutPassword>;

  getUsers(params: { take?: number; skip?: number }): Promise<{
    users: UserWithoutPassword[];
    total: number;
    limit: number;
    skip: number;
  }>;

  updateUserById(
    id: number,
    userData: UpdateUserDto,
  ): Promise<UserWithoutPassword>;
}
