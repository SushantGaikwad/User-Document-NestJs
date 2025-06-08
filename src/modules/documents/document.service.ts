import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentStatus } from '../../common/enums/document-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../common/entities/user.entity';
import { Document } from '../../common/entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private configService: ConfigService,
  ) {}

  async create(
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
    user: User,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const document = this.documentRepository.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      filePath: file.path,
      description: createDocumentDto.description,
      metadata: createDocumentDto.metadata,
      uploadedBy: user,
    });

    return this.documentRepository.save(document);
  }

  async findAll(
    user: User,
    page = 1,
    limit = 10,
    status?: DocumentStatus,
  ): Promise<{ documents: Document[]; total: number; pages: number }> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.uploadedBy', 'user')
      .orderBy('document.createdAt', 'DESC');

    // Viewer And Editor can see only their docs
    if ([UserRole.VIEWER, UserRole.EDITOR].includes(user.role)) {
      queryBuilder.where('document.uploadedBy = :userId', { userId: user.id });
    } 
    // Admins can see all documents (no additional filtering)

    if (status) {
      queryBuilder.andWhere('document.status = :status', { status });
    }

    const [documents, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      documents,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: User): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check permissions
    if (user.role === UserRole.VIEWER && document.uploadedBy.id !== user.id) {
      throw new ForbiddenException('You can only access your own documents');
    }

    return document;
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    user: User,
  ): Promise<Document> {
    const document = await this.findOne(id, user);

    // Check permissions for updating
    if (user.role === UserRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot update documents');
    }

    if (user.role === UserRole.EDITOR && document.uploadedBy.id !== user.id) {
      throw new ForbiddenException(
        'Editors can only update their own documents',
      );
    }

    Object.assign(document, updateDocumentDto);
    return this.documentRepository.save(document);
  }

  async remove(id: string, user: User): Promise<void> {
    const document = await this.findOne(id, user);

    // Check permissions
    if (user.role === UserRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot delete documents');
    }

    if (user.role === UserRole.EDITOR && document.uploadedBy.id !== user.id) {
      throw new ForbiddenException(
        'Editors can only delete their own documents',
      );
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await this.documentRepository.remove(document);
  }

  async downloadDocument(
    id: string,
    user: User,
  ): Promise<{ filePath: string; filename: string }> {
    const document = await this.findOne(id, user);

    if (!fs.existsSync(document.filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return {
      filePath: document.filePath,
      filename: document.originalName,
    };
  }

  async getDocumentStats(user: User): Promise<{
    total: number;
    byStatus: Record<DocumentStatus, number>;
    totalSize: number;
    recentUploads: number;
  }> {
    const queryBuilder = this.documentRepository.createQueryBuilder('document');

    // Apply role-based filtering
    if (user.role === UserRole.VIEWER) {
      queryBuilder.where('document.uploadedBy = :userId', { userId: user.id });
    } else if (user.role === UserRole.EDITOR) {
      queryBuilder.where('document.uploadedBy = :userId', { userId: user.id });
    }

    const [total, totalSizeResult, recentUploads] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.select('SUM(document.size)', 'totalSize').getRawOne(),
      queryBuilder
        .where('document.createdAt >= :date', {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        })
        .getCount(),
    ]);

    const statusStats = await queryBuilder
      .select('document.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('document.status')
      .getRawMany();

    const byStatus = statusStats.reduce(
      (acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      },
      {} as Record<DocumentStatus, number>,
    );

    return {
      total,
      byStatus,
      totalSize: parseInt(totalSizeResult?.totalSize || '0'),
      recentUploads,
    };
  }
}
