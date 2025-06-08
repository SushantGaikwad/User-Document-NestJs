import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { DocumentStatus } from '../../../common/enums/document-status.enum';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  metadata?: Record<string, any>;
}
