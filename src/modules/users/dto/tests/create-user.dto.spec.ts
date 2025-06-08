import { validate, ValidationError } from 'class-validator';
import { CreateUserDto } from '../create-user.dto';
import { UserRole } from '../../../../common/enums/user-role.enum';

describe('CreateUserDto', () => {
  let createUserDto: CreateUserDto;

  beforeEach(() => {
    createUserDto = new CreateUserDto();
  });

  async function validateDto(dto: CreateUserDto): Promise<ValidationError[]> {
    return validate(dto);
  }

  describe('firstName', () => {
    it('should pass with valid firstName', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when firstName is empty', async () => {
      createUserDto.firstName = '';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('firstName');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when firstName is not a string', async () => {
      createUserDto.firstName = 123 as any;
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('firstName');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when firstName is undefined', async () => {
      createUserDto.firstName = undefined as any;
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('firstName');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('lastName', () => {
    it('should pass with valid lastName', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when lastName is empty', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = '';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('lastName');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when lastName is not a string', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 123 as any;
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('lastName');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when lastName is undefined', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = undefined as any;
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('lastName');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('email', () => {
    it('should pass with valid email', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when email is invalid', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'invalid-email';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail when email is empty', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = '';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail when email is undefined', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = undefined as any;
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });
  });

  describe('password', () => {
    it('should pass with valid password', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when password is empty', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = '';
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when password is not a string', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 123 as any;
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when password is undefined', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = undefined as any;
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('role', () => {
    it('should pass when role is a valid UserRole', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      createUserDto.role = UserRole.ADMIN;
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when role is undefined (optional)', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      createUserDto.role = undefined;
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when role is not a valid UserRole', async () => {
      createUserDto.firstName = 'John';
      createUserDto.lastName = 'Doe';
      createUserDto.email = 'john.doe@example.com';
      createUserDto.password = 'password123';
      createUserDto.role = 'INVALID_ROLE' as any;
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });
  });

  describe('combined validation', () => {
    it('should fail with multiple invalid fields', async () => {
      createUserDto.firstName = '';
      createUserDto.lastName = 123 as any;
      createUserDto.email = 'invalid-email';
      createUserDto.password = undefined as any;
      createUserDto.role = 'INVALID_ROLE' as any;
      const errors = await validateDto(createUserDto);
      expect(errors).toHaveLength(5);
      const properties = errors.map((error) => error.property);
      expect(properties).toContain('firstName');
      expect(properties).toContain('lastName');
      expect(properties).toContain('email');
      expect(properties).toContain('password');
      expect(properties).toContain('role');
    });
  });
});