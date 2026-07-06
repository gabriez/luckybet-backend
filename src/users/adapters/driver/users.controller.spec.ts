import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { USER_CORE_PROVIDER } from '../../app/constants';
import { AdminRoles } from '../../app/entities/user.entity';
import type { ForManageUsers } from '../../ports/driven/ForManageUsers';
import { UsersController } from './users.controller';

type MockCore = jest.Mocked<ForManageUsers>;

describe('UsersController', () => {
  let controller: UsersController;
  let mockCore: MockCore;

  const mockUser = {
    id: 1,
    username: 'test_user',
    role: AdminRoles.REVIEWER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockCore = {
      createUser: jest.fn(),
      findById: jest.fn(),
      getUsers: jest.fn(),
      updateUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: USER_CORE_PROVIDER,
          useValue: mockCore,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /users (create) ──────────────────────────────────────

  describe('create', () => {
    const createDto = {
      username: 'new_user',
      password: 'secret123',
      role: AdminRoles.REVIEWER,
      isActive: true,
    };

    it('debería llamar a usersCore.createUser y devolver response formateada', async () => {
      mockCore.createUser.mockResolvedValue(mockUser);

      const result = await controller.create(createDto);

      expect(mockCore.createUser).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        data: mockUser,
        message: 'User created successfully',
        status: true,
      });
    });

    it('Should throw BadRequestException if user already exists', async () => {
      mockCore.createUser.mockRejectedValue(
        new BadRequestException('El usuario ya existe'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── GET /users (findAll) ──────────────────────────────────────

  describe('findAll', () => {
    const usersList = [mockUser];
    const total = 1;

    it('debería devolver lista paginada con limit y offset', async () => {
      mockCore.getUsers.mockResolvedValue({
        skip: 0,
        total,
        limit: 10,
        users: usersList,
      });

      const result = await controller.findAll(10, 0);

      expect(mockCore.getUsers).toHaveBeenCalledWith({ limit: 10, offset: 0 });
      expect(result).toMatchObject({
        data: usersList,
        message: 'Usuarios obtenidos exitosamente',
        status: true,
        meta: {
          total,
          totalPages: 1,
          page: 1,
          limit: 10,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      });
    });

    it('debería calcular hasNextPage correctamente cuando hay más páginas', async () => {
      mockCore.getUsers.mockResolvedValue({
        skip: 0,
        total,
        limit: 10,
        users: usersList,
      });

      const result = await controller.findAll(10, 0);

      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.totalPages).toBe(5);
    });
  });

  // ─── GET /users/:id (findOne) ──────────────────────────────────

  describe('findOne', () => {
    it('debería devolver el usuario encontrado', async () => {
      mockCore.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(mockCore.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        data: mockUser,
        message: 'Usuario obtenido exitosamente',
        status: true,
      });
    });
    it("Should thrown NotFoundException if user don't exist", async () => {
      mockCore.findById.mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );
      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── PATCH /users/:id (update) ─────────────────────────────────

  describe('update', () => {
    const updateDto = { role: AdminRoles.SUPER_ADMIN };
    const updatedUser = { ...mockUser, role: AdminRoles.SUPER_ADMIN };

    it('debería actualizar y devolver el usuario', async () => {
      mockCore.updateUserById.mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateDto);

      expect(mockCore.updateUserById).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual({
        data: updatedUser,
        message: 'Usuario editado exitosamente',
        status: true,
      });
    });

    it("Should thrown NotFoundException if user don't exist", async () => {
      mockCore.updateUserById.mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );
      await expect(controller.update(999, updatedUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
