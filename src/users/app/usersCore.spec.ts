import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TypeORMError } from 'typeorm';
import { ForDatabaseUsers } from '../ports/driver/ForDatabaseUsers';
import { AdminRoles } from './entities/user.entity';
import { UsersCore } from './usersCore';

type MockRepo = jest.Mocked<ForDatabaseUsers>;

describe('UsersCore', () => {
  let usersCore: UsersCore;
  let mockRepo: MockRepo;

  const validUser = {
    username: 'test_user',
    password: 'secret123',
    role: AdminRoles.REVIEWER,
    isActive: true,
  };

  const userWithoutPassword = {
    id: 1,
    username: 'test_user',
    role: AdminRoles.REVIEWER,
    isActive: true,
    comparePassword: jest.fn(),
  };

  beforeEach(() => {
    mockRepo = {
      createUser: jest.fn(),
      findByUnique: jest.fn(),
      getUsers: jest.fn(),
      updateUserById: jest.fn(),
    };

    usersCore = new UsersCore(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createUser ──────────────────────────────────────────────

  describe('createUser', () => {
    it('debería crear un usuario cuando no existe uno con el mismo username', async () => {
      mockRepo.findByUnique.mockResolvedValue(null);
      mockRepo.createUser.mockResolvedValue(userWithoutPassword);

      const result = await usersCore.createUser(validUser);

      expect(mockRepo.findByUnique).toHaveBeenCalledWith({
        username: validUser.username,
      });
      expect(mockRepo.createUser).toHaveBeenCalledWith(validUser);
      expect(result).toEqual(userWithoutPassword);
    });

    it('debería lanzar BadRequestException si el usuario ya existe', async () => {
      mockRepo.findByUnique.mockResolvedValue(userWithoutPassword);
      mockRepo.createUser.mockResolvedValue(userWithoutPassword);

      await expect(usersCore.createUser(validUser)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockRepo.createUser).not.toHaveBeenCalled();
    });

    it('debería lanzar TypeORMError si el repo falla', async () => {
      mockRepo.findByUnique.mockResolvedValue(null);
      mockRepo.createUser.mockRejectedValue(new TypeORMError('DB error'));

      await expect(usersCore.createUser(validUser)).rejects.toThrow(
        TypeORMError,
      );
    });
  });

  // ─── findById ────────────────────────────────────────────────

  describe('findById', () => {
    it('debería devolver el usuario cuando existe', async () => {
      mockRepo.findByUnique.mockResolvedValue(userWithoutPassword);

      const result = await usersCore.findById(1);

      expect(mockRepo.findByUnique).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(userWithoutPassword);
    });

    it('debería lanzar Error cuando el usuario no existe', async () => {
      mockRepo.findByUnique.mockResolvedValue(null);

      await expect(usersCore.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getUsers ────────────────────────────────────────────────

  describe('getUsers', () => {
    const usersList = [userWithoutPassword];
    const totalCount = 1;

    it('debería devolver usuarios con paginación', async () => {
      mockRepo.getUsers.mockResolvedValue([usersList, totalCount]);

      const result = await usersCore.getUsers({ take: 10, skip: 0 });

      expect(mockRepo.getUsers).toHaveBeenCalledWith({ take: 10, skip: 0 });
      expect(result).toEqual([usersList, totalCount]);
    });

    it('debería delegar los defaults si no se pasan parámetros', async () => {
      mockRepo.getUsers.mockResolvedValue([usersList, totalCount]);

      const result = await usersCore.getUsers({});

      expect(mockRepo.getUsers).toHaveBeenCalledWith({});
      expect(result).toEqual([usersList, totalCount]);
    });

    it('debería lanzar TypeORMError si el repo falla', async () => {
      mockRepo.getUsers.mockRejectedValue(new TypeORMError('DB error'));

      await expect(usersCore.getUsers({})).rejects.toThrow(TypeORMError);
    });
  });

  // ─── updateUserById ──────────────────────────────────────────

  describe('updateUserById', () => {
    const updateData = { role: AdminRoles.SUPER_ADMIN as const };

    it('debería actualizar y devolver el usuario', async () => {
      const updated = { ...userWithoutPassword, role: AdminRoles.SUPER_ADMIN };
      mockRepo.updateUserById.mockResolvedValue(updated);

      const result = await usersCore.updateUserById(1, updateData);

      expect(mockRepo.updateUserById).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updated);
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      mockRepo.updateUserById.mockResolvedValue(null);

      await expect(usersCore.updateUserById(999, updateData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar TypeORMError si el repo falla', async () => {
      mockRepo.updateUserById.mockRejectedValue(new TypeORMError('DB error'));

      await expect(usersCore.updateUserById(999, updateData)).rejects.toThrow(
        TypeORMError,
      );
    });
  });
});
