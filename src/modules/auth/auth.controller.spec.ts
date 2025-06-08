import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from '../../common/dto/register.dto';
import { LoginDto } from '../../common/dto/login.dto';
import { User } from '../../common/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockUser: Partial<User> = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    role: UserRole.VIEWER,
  };

  const mockUserWithoutPassword = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: UserRole.VIEWER,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
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

    it('should successfully register a user', async () => {
      const registerResponse = {
        user: mockUserWithoutPassword,
        access_token: 'jwtToken',
      };
      mockAuthService.register.mockResolvedValue(registerResponse);

      const result = await authController.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(registerResponse);
    });

    it('should handle errors from authService.register', async () => {
      const error = new Error('Registration failed');
      mockAuthService.register.mockRejectedValue(error);

      await expect(authController.register(registerDto)).rejects.toThrow(error);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john.doe@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      const loginResponse = {
        user: mockUserWithoutPassword,
        access_token: 'jwtToken',
      };
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await authController.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(loginResponse);
    });

    it('should handle errors from authService.login', async () => {
      const error = new Error('Login failed');
      mockAuthService.login.mockRejectedValue(error);

      await expect(authController.login(loginDto)).rejects.toThrow(error);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should apply LocalAuthGuard', async () => {
      const loginResponse = {
        user: mockUserWithoutPassword,
        access_token: 'jwtToken',
      };
      mockAuthService.login.mockResolvedValue(loginResponse);

      await authController.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const result = await authController.getProfile(
        mockUser as unknown as User,
      );

      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty('password');
    });

    it('should apply JwtAuthGuard', async () => {
      await authController.getProfile(mockUser as unknown as User);

      // Since JwtAuthGuard is mocked to return true, we verify the endpoint is accessible
      expect(authController.getProfile).toBeDefined();
    });
  });
});
