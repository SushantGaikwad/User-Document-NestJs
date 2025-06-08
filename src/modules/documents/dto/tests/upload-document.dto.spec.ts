import { validate, ValidationError } from 'class-validator';
import { UploadDocumentDto } from '../upload-document.dto';

describe('UploadDocumentDto', () => {
  let uploadDocumentDto: UploadDocumentDto;

  beforeEach(() => {
    uploadDocumentDto = new UploadDocumentDto();
  });

  async function validateDto(dto: UploadDocumentDto): Promise<ValidationError[]> {
    return validate(dto);
  }

  describe('file', () => {
    it('should pass with any file value (no validators)', async () => {
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with null file (no validators)', async () => {
      uploadDocumentDto.file = null;
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with undefined file (no validators)', async () => {
      uploadDocumentDto.file = undefined;
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('description', () => {
    it('should pass with valid description', async () => {
      uploadDocumentDto.description = 'A valid description';
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when description is undefined (optional)', async () => {
      uploadDocumentDto.description = undefined;
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when description is an empty string', async () => {
      uploadDocumentDto.description = '';
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when description is not a string', async () => {
      uploadDocumentDto.description = 123 as any;
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when description exceeds max length of 500', async () => {
      uploadDocumentDto.description = 'a'.repeat(501);
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('maxLength');
      expect(errors[0].constraints?.maxLength).toContain('description must be shorter than or equal to 500 characters');
    });

    it('should pass when description is exactly 500 characters', async () => {
      uploadDocumentDto.description = 'a'.repeat(500);
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('combined validation', () => {
    it('should pass with valid file and description', async () => {
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      uploadDocumentDto.description = 'Valid description';
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with valid file and no description (optional)', async () => {
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      uploadDocumentDto.description = undefined;
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with valid file and invalid description (non-string)', async () => {
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      uploadDocumentDto.description = 123 as any;
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail with valid file and description exceeding max length', async () => {
      uploadDocumentDto.file = { buffer: Buffer.from('test'), originalname: 'test.txt' };
      uploadDocumentDto.description = 'a'.repeat(501);
      const errors = await validateDto(uploadDocumentDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });
  });
});