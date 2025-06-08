import { validate, ValidationError } from 'class-validator';
import { UpdateUserRoleDto } from '../update-user-role.dto';
import { UserRole } from '../../../../common/enums/user-role.enum';

describe('UpdateUserRoleDto', () => {
  let updateUserRoleDto: UpdateUserRoleDto;

  beforeEach(() => {
    updateUserRoleDto = new UpdateUserRoleDto();
  });

  async function validateDto(dto: UpdateUserRoleDto): Promise<ValidationError[]> {
    return validate(dto);
  }

  describe('role', () => {
    it('should pass with valid UserRole', async () => {
      updateUserRoleDto.role = UserRole.ADMIN;
      const errors = await validateDto(updateUserRoleDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with another valid UserRole', async () => {
      updateUserRoleDto.role = UserRole.EDITOR;
      const errors = await validateDto(updateUserRoleDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when role is not a valid UserRole', async () => {
      updateUserRoleDto.role = 'INVALID_ROLE' as any;
      const errors = await validateDto(updateUserRoleDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
      expect(errors[0]?.constraints?.isEnum).toContain('must be one of the following values');
    });

    it('should fail when role is undefined', async () => {
      updateUserRoleDto.role = undefined as any;
      const errors = await validateDto(updateUserRoleDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail when role is null', async () => {
      updateUserRoleDto.role = null as any;
      const errors = await validateDto(updateUserRoleDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail when role is a non-string value', async () => {
      updateUserRoleDto.role = 123 as any;
      const errors = await validateDto(updateUserRoleDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });
  });
});