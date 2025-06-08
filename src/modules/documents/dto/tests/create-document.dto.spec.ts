import { validate, ValidationError } from 'class-validator';
import { CreateDocumentDto } from '../create-document.dto';

describe('CreateDocumentDto', () => {
  let createDocumentDto: CreateDocumentDto;

  beforeEach(() => {
    createDocumentDto = new CreateDocumentDto();
  });

  async function validateDto(dto: CreateDocumentDto): Promise<ValidationError[]> {
    return validate(dto);
  }

  describe('description', () => {
    it('should pass with valid description', async () => {
      createDocumentDto.description = 'A valid description';
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when description is undefined (optional)', async () => {
      createDocumentDto.description = undefined;
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when description is an empty string', async () => {
      createDocumentDto.description = '';
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when description is not a string', async () => {
      createDocumentDto.description = 123 as any;
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when description exceeds max length of 500', async () => {
      createDocumentDto.description = 'a'.repeat(501);
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('maxLength');
      expect(errors[0].constraints?.maxLength).toContain('description must be shorter than or equal to 500 characters');
    });

    it('should pass when description is exactly 500 characters', async () => {
      createDocumentDto.description = 'a'.repeat(500);
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('metadata', () => {
    it('should pass with valid metadata object', async () => {
      createDocumentDto.metadata = { key: 'value', number: 123 };
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when metadata is undefined (optional)', async () => {
      createDocumentDto.metadata = undefined;
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when metadata is an empty object', async () => {
      createDocumentDto.metadata = {};
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with null metadata (optional)', async () => {
      createDocumentDto.metadata = null as any;
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('combined validation', () => {
    it('should pass with valid description and metadata', async () => {
      createDocumentDto.description = 'Valid description';
      createDocumentDto.metadata = { key: 'value' };
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with no fields provided (all optional)', async () => {
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid description and valid metadata', async () => {
      createDocumentDto.description = 123 as any;
      createDocumentDto.metadata = { key: 'value' };
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail with description exceeding max length and valid metadata', async () => {
      createDocumentDto.description = 'a'.repeat(501);
      createDocumentDto.metadata = { key: 'value' };
      const errors = await validateDto(createDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });
  });
});