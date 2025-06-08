import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  file: any;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
