import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
  UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { DocumentStatus } from '../../common/enums/document-status.enum';
import { MulterExceptionFilter } from '../../common/filters/multer-exception.filter';
import { editFileName, imageFileFilter } from '../../common/utils/file.utils';
import { DocumentsService } from './document.service';
import { User } from '../../common/entities/user.entity';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(MulterExceptionFilter)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.create(file, createDocumentDto, user);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @CurrentUser() user: User,
    @Query('status') status? : DocumentStatus,
  ) {
    return this.documentsService.findAll(user, +page, +limit, status);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: User) {
    return this.documentsService.getDocumentStats(user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.documentsService.findOne(id, user);
  }

  @Get(':id/download')
  async downloadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const { filePath, filename } = await this.documentsService.downloadDocument(id, user);
    res.download(filePath, filename);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.update(id, updateDocumentDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.documentsService.remove(id, user);
  }
}