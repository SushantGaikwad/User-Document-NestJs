import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from '../../common/dto/register.dto';
import { LoginDto } from '../../common/dto/login.dto';
import { User } from '../../common/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUser: Partial<User> = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    role: UserRole.VIEWER,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: UserRole.VIEWER,
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword';
      const userWithoutPassword = { ...mockUser, password: undefined };
      mockUsersService.findByEmail.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwtToken');

      const result = await authService.register(registerDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toEqual({
        user: userWithoutPassword,
        access_token: 'jwtToken',
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john.doe@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      const userWithoutPassword = { ...mockUser, password: undefined };
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as unknown as User);
      mockJwtService.sign.mockReturnValue('jwtToken');

      const result = await authService.login(loginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toEqual({
        user: userWithoutPassword,
        access_token: 'jwtToken',
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user if email and password are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.validateUser(mockUser?.email!, 'password123');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser('nonexistent@example.com', 'password123');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await authService.validateUser(mockUser.email!, 'wrongPassword');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', mockUser.password);
      expect(result).toBeNull();
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token with correct payload', () => {
      mockJwtService.sign.mockReturnValue('jwtToken');

      const result = (authService as any).generateToken(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toBe('jwtToken');
    });
  });
});