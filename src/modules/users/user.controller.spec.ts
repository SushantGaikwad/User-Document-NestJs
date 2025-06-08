import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User } from '../../common/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    role: UserRole.VIEWER,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: mockUser.id,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    email: mockUser.email,
    role: mockUser.role,
    isDeleted: mockUser.isDeleted,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    updateRole: jest.fn(),
    deactivate: jest.fn(),
    activate: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: UserRole.VIEWER,
    };

    it('should successfully create a user and exclude password', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await usersController.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.create.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(usersController.create(createUserDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users without passwords', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: '223e4567-e89b-12d3-a456-426614174001' },
      ];
      const total = 2;
      const pages = 1;
      mockUsersService.findAll.mockResolvedValue({ users, total, pages });

      const result = await usersController.findAll(1, 10);

      expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({
        users: users.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isDeleted: user.isDeleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        total,
        pages,
      });
      expect(
        result.users.every((user) => !user.hasOwnProperty('password')),
      ).toBe(true);
    });

    it('should handle empty user list', async () => {
      mockUsersService.findAll.mockResolvedValue({
        users: [],
        total: 0,
        pages: 0,
      });

      const result = await usersController.findAll(1, 10);

      expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({ users: [], total: 0, pages: 0 });
    });

    it('should use default pagination values if not provided', async () => {
      mockUsersService.findAll.mockResolvedValue({
        users: [],
        total: 0,
        pages: 0,
      });

      const result = await usersController.findAll(undefined, undefined);

      expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({ users: [], total: 0, pages: 0 });
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Jane',
      email: 'jane.doe@example.com',
    };

    it('should successfully update a user and exclude password', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await usersController.update(mockUser.id!, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
      expect(result).toEqual({
        ...mockUserWithoutPassword,
        ...updateUserDto,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersService.update.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        usersController.update(mockUser.id!, updateUserDto),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.update.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(
        usersController.update(mockUser.id!, updateUserDto),
      ).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
    });

    it.skip('should throw BadRequestException for invalid UUID', async () => {
      await expect(
        usersController.update('invalid-uuid', updateUserDto),
      ).rejects.toThrow(
        new BadRequestException('Validation failed (uuid is expected)'),
      );
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    const updateUserRoleDto: UpdateUserRoleDto = { role: UserRole.ADMIN };

    it('should successfully update user role and exclude password', async () => {
      const updatedUser = { ...mockUser, role: UserRole.ADMIN };
      mockUsersService.updateRole.mockResolvedValue(updatedUser);

      const result = await usersController.updateRole(
        mockUser.id!,
        updateUserRoleDto,
      );

      expect(mockUsersService.updateRole).toHaveBeenCalledWith(
        mockUser.id,
        updateUserRoleDto,
      );
      expect(result).toEqual({
        ...mockUserWithoutPassword,
        role: UserRole.ADMIN,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersService.updateRole.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        usersController.updateRole(mockUser.id!, updateUserRoleDto),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(mockUsersService.updateRole).toHaveBeenCalledWith(
        mockUser.id,
        updateUserRoleDto,
      );
    });

    it.skip('should throw BadRequestException for invalid UUID', async () => {
      await expect(
        usersController.updateRole('invalid-uuid', updateUserRoleDto),
      ).rejects.toThrow(
        new BadRequestException('Validation failed (uuid is expected)'),
      );
      expect(mockUsersService.updateRole).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should successfully deactivate a user and exclude password', async () => {
      const deactivatedUser = { ...mockUser, isDeleted: false }; // Note: Service sets isDeleted to false
      mockUsersService.deactivate.mockResolvedValue(deactivatedUser);

      const result = await usersController.deactivate(mockUser.id!);

      expect(mockUsersService.deactivate).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        ...mockUserWithoutPassword,
        isDeleted: false,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersService.deactivate.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(usersController.deactivate(mockUser.id!)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUsersService.deactivate).toHaveBeenCalledWith(mockUser.id);
    });

    it.skip('should throw BadRequestException for invalid UUID', async () => {
      await expect(usersController.deactivate('invalid-uuid')).rejects.toThrow(
        new BadRequestException('Validation failed (uuid is expected)'),
      );
      expect(mockUsersService.deactivate).not.toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('should successfully activate a user and exclude password', async () => {
      const activatedUser = { ...mockUser, isDeleted: true }; // Note: Service sets isDeleted to true
      mockUsersService.activate.mockResolvedValue(activatedUser);

      const result = await usersController.activate(mockUser.id!);

      expect(mockUsersService.activate).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        ...mockUserWithoutPassword,
        isDeleted: true,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersService.activate.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(usersController.activate(mockUser.id!)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUsersService.activate).toHaveBeenCalledWith(mockUser.id);
    });

    it.skip('should throw BadRequestException for invalid UUID', async () => {
      await expect(usersController.activate('invalid-uuid')).rejects.toThrow(
        new BadRequestException('Validation failed (uuid is expected)'),
      );
      expect(mockUsersService.activate).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should successfully remove a user and return no content', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await usersController.remove(mockUser.id!);

      expect(mockUsersService.remove).toHaveBeenCalledWith(mockUser.id);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(usersController.remove(mockUser.id!)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUsersService.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it.skip('should throw BadRequestException for invalid UUID', async () => {
      await expect(usersController.remove('invalid-uuid')).rejects.toThrow(
        new BadRequestException('Validation failed (uuid is expected)'),
      );
      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });
  });
});
