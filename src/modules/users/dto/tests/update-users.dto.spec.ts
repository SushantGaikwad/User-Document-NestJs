import { validate, ValidationError } from 'class-validator';
import { UpdateUserDto } from '../update-user.dto';
import { UserRole } from '../../../../common/enums/user-role.enum';

describe('UpdateUserDto', () => {
  let updateUserDto: UpdateUserDto;

  beforeEach(() => {
    updateUserDto = new UpdateUserDto();
  });

  async function validateDto(dto: UpdateUserDto): Promise<ValidationError[]> {
    return validate(dto);
  }

  describe('firstName', () => {
    it('should pass with valid firstName', async () => {
      updateUserDto.firstName = 'John';
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when firstName is undefined (optional)', async () => {
      updateUserDto.firstName = undefined;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when firstName is not a string', async () => {
      updateUserDto.firstName = 123 as any;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('firstName');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass when firstName is an empty string', async () => {
      updateUserDto.firstName = '';
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('lastName', () => {
    it('should pass with valid lastName', async () => {
      updateUserDto.lastName = 'Doe';
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when lastName is undefined (optional)', async () => {
      updateUserDto.lastName = undefined;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when lastName is not a string', async () => {
      updateUserDto.lastName = 123 as any;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('lastName');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass when lastName is an empty string', async () => {
      updateUserDto.lastName = '';
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('email', () => {
    it('should pass with valid email', async () => {
      updateUserDto.email = 'john.doe@example.com';
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when email is undefined (optional)', async () => {
      updateUserDto.email = undefined;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when email is invalid', async () => {
      updateUserDto.email = 'invalid-email';
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail when email is not a string', async () => {
      updateUserDto.email = 123 as any;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });
  });

  describe('role', () => {
    it('should pass with valid UserRole', async () => {
      updateUserDto.role = UserRole.ADMIN;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when role is undefined (optional)', async () => {
      updateUserDto.role = undefined;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when role is not a valid UserRole', async () => {
      updateUserDto.role = 'INVALID_ROLE' as any;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail when role is a non-string value', async () => {
      updateUserDto.role = 123 as any;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });
  });

  describe('combined validation', () => {
    it('should pass with all valid fields', async () => {
      updateUserDto.firstName = 'John';
      updateUserDto.lastName = 'Doe';
      updateUserDto.email = 'john.doe@example.com';
      updateUserDto.role = UserRole.ADMIN;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with no fields provided (all optional)', async () => {
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with multiple invalid fields', async () => {
      updateUserDto.firstName = 123 as any;
      updateUserDto.lastName = true as any;
      updateUserDto.email = 'invalid-email';
      updateUserDto.role = 'INVALID_ROLE' as any;
      const errors = await validateDto(updateUserDto);
      expect(errors).toHaveLength(4);
      const properties = errors.map((error) => error.property);
      expect(properties).toContain('firstName');
      expect(properties).toContain('lastName');
      expect(properties).toContain('email');
      expect(properties).toContain('role');
    });
  });
});
