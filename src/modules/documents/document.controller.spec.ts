import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './document.controller';
import { DocumentsService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from '../../common/entities/document.entity';
import { User } from '../../common/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { DocumentStatus } from '../../common/enums/document-status.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MulterExceptionFilter } from '../../common/filters/multer-exception.filter';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ParseUUIDPipe } from '@nestjs/common';

describe('DocumentsController', () => {
  let documentsController: DocumentsController;
  let documentsService: DocumentsService;
  let parseUUIDPipe: ParseUUIDPipe;

  const mockUser: Partial<User> = {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    role: UserRole.ADMIN,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEditorUser: User = {
    ...mockUser,
    id: 'user2',
    role: UserRole.EDITOR,
  } as unknown as User;
  const mockViewerUser: User = {
    ...mockUser,
    id: 'user3',
    role: UserRole.VIEWER,
  } as unknown as User;

  const mockDocument: Partial<Document> = {
    id: 'doc1',
    filename: 'file123.pdf',
    originalName: 'document.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    filePath: '/uploads/file123.pdf',
    description: 'Test document',
    metadata: { key: 'value' },
    status: DocumentStatus.PENDING,
    uploadedBy: mockUser as unknown as User,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocumentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getDocumentStats: jest.fn(),
    findOne: jest.fn(),
    downloadDocument: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockResponse = {
    download: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideProvider(MulterExceptionFilter)
      .useValue({ catch: jest.fn() })
      .compile();

    documentsController = module.get<DocumentsController>(DocumentsController);
    documentsService = module.get<DocumentsService>(DocumentsService);
    parseUUIDPipe = new ParseUUIDPipe(); // Initialize ParseUUIDPipe for testing
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    const createDocumentDto: CreateDocumentDto = {
      description: 'Test document',
      metadata: { key: 'value' },
    };
    const file: Express.Multer.File = {
      filename: 'file123.pdf',
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      path: '/uploads/file123.pdf',
      buffer: Buffer.from(''),
      destination: '',
      fieldname: '',
      stream: null as any,
      encoding: '',
    };
    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });

    it('should successfully upload a document', async () => {
      mockDocumentsService.create.mockResolvedValue(mockDocument);

      const result = await documentsController.uploadDocument(
        file,
        createDocumentDto,
        mockUser as unknown as User,
      );

      expect(mockDocumentsService.create).toHaveBeenCalledWith(
        file,
        createDocumentDto,
        mockUser,
      );
      expect(result).toEqual(mockDocument);
    });

    it('should throw BadRequestException if file is missing', async () => {
      mockDocumentsService.create.mockRejectedValue(
        new BadRequestException('File is required'),
      );

      await expect(
        documentsController.uploadDocument(
          null as any,
          createDocumentDto,
          mockUser as unknown as User,
        ),
      ).rejects.toThrow(new BadRequestException('File is required'));
      expect(mockDocumentsService.create).toHaveBeenCalledWith(
        null,
        createDocumentDto,
        mockUser,
      );
    });
  });

  describe('findAll', () => {
    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });
    it('should return paginated documents', async () => {
      const documents = [mockDocument, { ...mockDocument, id: 'doc2' }];
      const total = 2;
      const pages = 1;
      mockDocumentsService.findAll.mockResolvedValue({
        documents,
        total,
        pages,
      });

      const result = await documentsController.findAll(
        1,
        10,
        mockUser as unknown as User,
        undefined,
      );

      expect(mockDocumentsService.findAll).toHaveBeenCalledWith(
        mockUser,
        1,
        10,
        undefined,
      );
      expect(result).toEqual({ documents, total, pages });
    });

    it('should filter by status', async () => {
      const documents = [mockDocument];
      const total = 1;
      const pages = 1;
      mockDocumentsService.findAll.mockResolvedValue({
        documents,
        total,
        pages,
      });

      const result = await documentsController.findAll(
        1,
        10,
        mockUser as unknown as User,
        DocumentStatus.COMPLETED,
      );

      expect(mockDocumentsService.findAll).toHaveBeenCalledWith(
        mockUser,
        1,
        10,
        DocumentStatus.COMPLETED,
      );
      expect(result).toEqual({ documents, total, pages });
    });

    it('should use default pagination values', async () => {
      const documents = [];
      const total = 0;
      const pages = 0;
      mockDocumentsService.findAll.mockResolvedValue({
        documents,
        total,
        pages,
      });

      const result = await documentsController.findAll(
        undefined,
        undefined,
        mockUser as unknown as User,
        undefined,
      );

      expect(mockDocumentsService.findAll).toHaveBeenCalledWith(
        mockUser,
        1,
        10,
        undefined,
      );
      expect(result).toEqual({ documents, total, pages });
    });
  });

  describe('getStats', () => {
    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });
    it('should return document stats', async () => {
      const stats = {
        total: 10,
        byStatus: {
          [DocumentStatus.PENDING]: 5,
          [DocumentStatus.COMPLETED]: 5,
        },
        totalSize: 5000,
        recentUploads: 2,
      };
      mockDocumentsService.getDocumentStats.mockResolvedValue(stats);

      const result = await documentsController.getStats(
        mockUser as unknown as User,
      );

      expect(mockDocumentsService.getDocumentStats).toHaveBeenCalledWith(
        mockUser,
      );
      expect(result).toEqual(stats);
    });
  });

  describe('findOne', () => {
    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });
    it('should return a document', async () => {
      mockDocumentsService.findOne.mockResolvedValue(mockDocument);

      const result = await documentsController.findOne(
        'doc1',
        mockUser as unknown as User,
      );

      expect(mockDocumentsService.findOne).toHaveBeenCalledWith(
        'doc1',
        mockUser,
      );
      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException if document does not exist', async () => {
      mockDocumentsService.findOne.mockRejectedValue(
        new NotFoundException('Document not found'),
      );

      await expect(
        documentsController.findOne('doc1', mockUser as unknown as User),
      ).rejects.toThrow(new NotFoundException('Document not found'));
      expect(mockDocumentsService.findOne).toHaveBeenCalledWith(
        'doc1',
        mockUser,
      );
    });

    it('should throw ForbiddenException for VIEWER accessing another user’s document', async () => {
      mockDocumentsService.findOne.mockRejectedValue(
        new ForbiddenException('You can only access your own documents'),
      );

      await expect(
        documentsController.findOne('doc1', mockViewerUser),
      ).rejects.toThrow(
        new ForbiddenException('You can only access your own documents'),
      );
      expect(mockDocumentsService.findOne).toHaveBeenCalledWith(
        'doc1',
        mockViewerUser,
      );
    });


    it('should throw BadRequestException for invalid UUID', async () => {
      await expect(parseUUIDPipe.transform('invalid-uuid', { type: 'param' })).rejects.toThrow(
        new BadRequestException('Validation failed (uuid is expected)'),
      );
      expect(mockDocumentsService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('downloadDocument', () => {
    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });
    it('should call res.download with correct file path and filename', async () => {
      mockDocumentsService.downloadDocument.mockResolvedValue({
        filePath: '/uploads/file123.pdf',
        filename: 'document.pdf',
      });

      await documentsController.downloadDocument(
        'doc1',
        mockUser as unknown as User,
        mockResponse,
      );

      expect(mockDocumentsService.downloadDocument).toHaveBeenCalledWith(
        'doc1',
        mockUser,
      );
      expect(mockResponse.download).toHaveBeenCalledWith(
        '/uploads/file123.pdf',
        'document.pdf',
      );
    });

    it('should throw NotFoundException if document does not exist', async () => {
      mockDocumentsService.downloadDocument.mockRejectedValue(
        new NotFoundException('Document not found'),
      );

      await expect(
        documentsController.downloadDocument(
          'doc1',
          mockUser as unknown as User,
          mockResponse,
        ),
      ).rejects.toThrow(new NotFoundException('Document not found'));
      expect(mockDocumentsService.downloadDocument).toHaveBeenCalledWith(
        'doc1',
        mockUser,
      );
      expect(mockResponse.download).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid UUID', async () => {
      await expect(parseUUIDPipe.transform('invalid-uuid', { type: 'param' })).rejects.toThrow(
        new BadRequestException('Validation failed (uuid is expected)'),
      );
      expect(mockDocumentsService.downloadDocument).not.toHaveBeenCalled();
      expect(mockResponse.download).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });
    const updateDocumentDto: UpdateDocumentDto = {
      description: 'Updated description',
      status: DocumentStatus.COMPLETED,
      metadata: { updated: true },
    };

    it('should successfully update a document', async () => {
      mockDocumentsService.update.mockResolvedValue({
        ...mockDocument,
        ...updateDocumentDto,
      });

      const result = await documentsController.update(
        'doc1',
        updateDocumentDto,
        mockUser as unknown as User,
      );

      expect(mockDocumentsService.update).toHaveBeenCalledWith(
        'doc1',
        updateDocumentDto,
        mockUser,
      );
      expect(result).toEqual({ ...mockDocument, ...updateDocumentDto });
    });

    it('should throw NotFoundException if document does not exist', async () => {
      mockDocumentsService.update.mockRejectedValue(
        new NotFoundException('Document not found'),
      );

      await expect(
        documentsController.update(
          'doc1',
          updateDocumentDto,
          mockUser as unknown as User,
        ),
      ).rejects.toThrow(new NotFoundException('Document not found'));
      expect(mockDocumentsService.update).toHaveBeenCalledWith(
        'doc1',
        updateDocumentDto,
        mockUser,
      );
    });

    it('should throw ForbiddenException for VIEWER', async () => {
      mockDocumentsService.update.mockRejectedValue(
        new ForbiddenException('Viewers cannot update documents'),
      );

      await expect(
        documentsController.update('doc1', updateDocumentDto, mockViewerUser),
      ).rejects.toThrow(
        new ForbiddenException('Viewers cannot update documents'),
      );
      expect(mockDocumentsService.update).toHaveBeenCalledWith(
        'doc1',
        updateDocumentDto,
        mockViewerUser,
      );
    });

   it('should throw BadRequestException for invalid UUID', async () => {
      await expect(parseUUIDPipe.transform('invalid-uuid', { type: 'param' })).rejects.toThrow(
        new BadRequestException('Validation failed (uuid is expected)'),
      );
      expect(mockDocumentsService.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });
    it('should successfully remove a document and return no content', async () => {
      mockDocumentsService.remove.mockResolvedValue(undefined);

      const result = await documentsController.remove(
        'doc1',
        mockUser as unknown as User,
      );

      expect(mockDocumentsService.remove).toHaveBeenCalledWith(
        'doc1',
        mockUser,
      );
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if document does not exist', async () => {
      mockDocumentsService.remove.mockRejectedValue(
        new NotFoundException('Document not found'),
      );

      await expect(
        documentsController.remove('doc1', mockUser as unknown as User),
      ).rejects.toThrow(new NotFoundException('Document not found'));
      expect(mockDocumentsService.remove).toHaveBeenCalledWith(
        'doc1',
        mockUser,
      );
    });

    it('should throw ForbiddenException for VIEWER', async () => {
      mockDocumentsService.remove.mockRejectedValue(
        new ForbiddenException('Viewers cannot delete documents'),
      );

      await expect(
        documentsController.remove('doc1', mockViewerUser),
      ).rejects.toThrow(
        new ForbiddenException('Viewers cannot delete documents'),
      );
      expect(mockDocumentsService.remove).toHaveBeenCalledWith(
        'doc1',
        mockViewerUser,
      );
    });

    it('should throw BadRequestException for invalid UUID', async () => {
      await expect(parseUUIDPipe.transform('invalid-uuid', { type: 'param' })).rejects.toThrow(
        new BadRequestException('Validation failed (uuid is expected)'),
      );
      expect(mockDocumentsService.remove).not.toHaveBeenCalled();
    });
  });
});
