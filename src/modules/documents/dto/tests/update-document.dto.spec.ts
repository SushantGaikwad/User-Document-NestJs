import { validate, ValidationError } from 'class-validator';
import { UpdateDocumentDto } from '../update-document.dto';
import { DocumentStatus } from '../../../../common/enums/document-status.enum';

describe('UpdateDocumentDto', () => {
  let updateDocumentDto: UpdateDocumentDto;

  beforeEach(() => {
    updateDocumentDto = new UpdateDocumentDto();
  });

  async function validateDto(
    dto: UpdateDocumentDto,
  ): Promise<ValidationError[]> {
    return validate(dto);
  }

  describe('description', () => {
    it('should pass with valid description', async () => {
      updateDocumentDto.description = 'A valid description';
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when description is undefined (optional)', async () => {
      updateDocumentDto.description = undefined;
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when description is an empty string', async () => {
      updateDocumentDto.description = '';
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when description is not a string', async () => {
      updateDocumentDto.description = 123 as any;
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when description exceeds max length of 500', async () => {
      updateDocumentDto.description = 'a'.repeat(501);
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('maxLength');
      expect(errors[0].constraints?.maxLength).toContain(
        'description must be shorter than or equal to 500 characters',
      );
    });

    it('should pass when description is exactly 500 characters', async () => {
      updateDocumentDto.description = 'a'.repeat(500);
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('status', () => {
    it('should pass with valid DocumentStatus', async () => {
      updateDocumentDto.status = DocumentStatus.PROCESSING;
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when status is undefined (optional)', async () => {
      updateDocumentDto.status = undefined;
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when status is not a valid DocumentStatus', async () => {
      updateDocumentDto.status = 'INVALID_STATUS' as any;
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
      expect(errors[0].constraints).toHaveProperty('isEnum');
      expect(errors[0].constraints?.isEnum).toContain(
        'must be one of the following values',
      );
    });

    it('should fail when status is a non-string value', async () => {
      updateDocumentDto.status = 123 as any;
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should pass with another valid DocumentStatus', async () => {
      updateDocumentDto.status = DocumentStatus.PENDING;
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('metadata', () => {
    it('should pass with valid metadata object', async () => {
      updateDocumentDto.metadata = { key: 'value', number: 123 };
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when metadata is undefined (optional)', async () => {
      updateDocumentDto.metadata = undefined;
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when metadata is an empty object', async () => {
      updateDocumentDto.metadata = {};
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with null metadata (optional)', async () => {
      updateDocumentDto.metadata = null as any;
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('combined validation', () => {
    it('should pass with valid description, status, and metadata', async () => {
      updateDocumentDto.description = 'Valid description';
      updateDocumentDto.status = DocumentStatus.PROCESSING;
      updateDocumentDto.metadata = { key: 'value' };
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with no fields provided (all optional)', async () => {
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid description and valid status and metadata', async () => {
      updateDocumentDto.description = 123 as any;
      updateDocumentDto.status = DocumentStatus.PROCESSING;
      updateDocumentDto.metadata = { key: 'value' };
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail with description exceeding max length and valid status and metadata', async () => {
      updateDocumentDto.description = 'a'.repeat(501);
      updateDocumentDto.status = DocumentStatus.PROCESSING;
      updateDocumentDto.metadata = { key: 'value' };
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail with invalid status and valid description and metadata', async () => {
      updateDocumentDto.description = 'Valid description';
      updateDocumentDto.status = 'INVALID_STATUS' as any;
      updateDocumentDto.metadata = { key: 'value' };
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail with multiple invalid fields', async () => {
      updateDocumentDto.description = 'a'.repeat(501);
      updateDocumentDto.status = 'INVALID_STATUS' as any;
      updateDocumentDto.metadata = { key: 'value' };
      const errors = await validateDto(updateDocumentDto);
      expect(errors).toHaveLength(2);
      const properties = errors.map((error) => error.property);
      expect(properties).toContain('description');
      expect(properties).toContain('status');
    });
  });
});
