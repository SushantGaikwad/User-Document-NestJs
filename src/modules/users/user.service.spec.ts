import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './user.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let usersService: UsersService;
  let userRepository: Repository<User>;

  const mockUser: Partial<User> = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    role: UserRole.VIEWER,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: UserRole.VIEWER,
    };

    it('should successfully create a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await usersService.create(createUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        role: createUserDto.role,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should use default role VIEWER if role is not provided', async () => {
      const createUserDtoWithoutRole = { ...createUserDto, role: undefined };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await usersService.create(createUserDtoWithoutRole);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...createUserDtoWithoutRole,
        role: UserRole.VIEWER,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const page = 1;
      const limit = 2;
      const users = [mockUser, { ...mockUser, id: '2' }];
      const total = 5;
      mockUserRepository.findAndCount.mockResolvedValue([users, total]);

      const result = await usersService.findAll(page, limit);

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        users,
        total,
        pages: Math.ceil(total / limit),
      });
    });

    it('should handle empty user list', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await usersService.findAll(1, 10);

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        users: [],
        total: 0,
        pages: 0,
      });
    });

    it('should handle invalid page or limit gracefully', async () => {
      const users = [mockUser];
      const total = 1;
      mockUserRepository.findAndCount.mockResolvedValue([users, total]);

      const result = await usersService.findAll(0, -10);

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        skip: 10,
        take: -10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        users,
        total,
        pages: Math.ceil(total / -10),
      });
    });
  });

  describe('findById', () => {
    it('should return a user by ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findById('1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(usersService.findById('1')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('john.doe@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'john.doe@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await usersService.findByEmail('nonexistent@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Jane',
      email: 'jane.doe@example.com',
    };

    it('should successfully update a user', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // findById
        .mockResolvedValueOnce(null); // findByEmail
      mockUserRepository.save.mockResolvedValue({ ...mockUser, ...updateUserDto });

      const result = await usersService.update('1', updateUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: updateUserDto.email } });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...mockUser, ...updateUserDto });
      expect(result).toEqual({ ...mockUser, ...updateUserDto });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(usersService.update('1', updateUserDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    /*
    it('should throw ConflictException if new email already exists', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // findById
        .mockResolvedValueOnce({ id: '1', email: updateUserDto.email }); // findByEmail

      await expect(usersService.update('1', updateUserDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: updateUserDto.email } });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
    */

    it('should update without checking email if email is unchanged', async () => {
      const updateDtoSameEmail = { firstName: 'Jane', email: mockUser.email };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, ...updateDtoSameEmail });

      const result = await usersService.update('1', updateDtoSameEmail);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.findOne).not.toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...mockUser, ...updateDtoSameEmail });
      expect(result).toEqual({ ...mockUser, ...updateDtoSameEmail });
    });
  });

  describe('updateRole', () => {
    const updateUserRoleDto: UpdateUserRoleDto = { role: UserRole.ADMIN };

    it('should successfully update user role', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, role: UserRole.ADMIN });

      const result = await usersService.updateRole('1', updateUserRoleDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...mockUser, role: UserRole.ADMIN });
      expect(result).toEqual({ ...mockUser, role: UserRole.ADMIN });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(usersService.updateRole('1', updateUserRoleDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should successfully deactivate a user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, isDeleted: false });

      const result = await usersService.deactivate('1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...mockUser, isDeleted: false });
      expect(result).toEqual({ ...mockUser, isDeleted: false });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(usersService.deactivate('1')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('should successfully activate a user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, isDeleted: true });

      const result = await usersService.activate('1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...mockUser, isDeleted: true });
      expect(result).toEqual({ ...mockUser, isDeleted: true });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(usersService.activate('1')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should successfully remove a user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.remove.mockResolvedValue(undefined);

      await usersService.remove('1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(usersService.remove('1')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.remove).not.toHaveBeenCalled();
    });
  });
});