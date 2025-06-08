import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { testDatabaseConfig } from '../test-database';
import { Document } from '../../src/common/entities/document.entity';
import { User } from '../../src/common/entities/user.entity';
import { UserRole } from '../../src/common/enums/user-role.enum';
import { INestApplication } from '@nestjs/common';

export class TestHelpers {
  static async createTestingModule(
    modules: any[] = [],
    providers: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        TypeOrmModule.forFeature([User, Document]),
        ...modules,
      ],
      providers: [...providers],
    }).compile();
  }

  // Updated method to handle foreign key constraints properly
  static async cleanDatabase(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;

    // Disable foreign key checks temporarily
    await dataSource.query('SET session_replication_role = replica;');

    try {
      // Delete data from all tables in reverse order to handle dependencies
      for (const entity of entities.reverse()) {
        const repository = dataSource.getRepository(entity.name);
        await repository.clear();
      }
    } finally {
      // Re-enable foreign key checks
      await dataSource.query('SET session_replication_role = DEFAULT;');
    }
  }

  // Alternative method using TRUNCATE CASCADE (more aggressive)
  static async truncateAllTables(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const tableName = entity.tableName;
      await dataSource.query(
        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
      );
    }
  }

  // Method to clean specific tables in order
  static async cleanTablesInOrder(dataSource: DataSource): Promise<void> {
    // Clean tables in order to avoid foreign key constraint violations
    const tableOrder = ['ingestion', 'document', 'user']; // Adjust based on your schema

    for (const tableName of tableOrder) {
      await dataSource.query(`DELETE FROM "${tableName}";`);
    }
  }

  static async createTestUser(
    userRepository: Repository<User>,
    overrides: Partial<User> = {},
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = userRepository.create({
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.VIEWER,
      ...overrides
    });

    return userRepository.save(user);
  }

  static async createTestDocument(
    documentRepository: Repository<Document>,
    user: User,
    overrides: Partial<Document> = {},
  ): Promise<Document> {
    const document = documentRepository.create({
      description: 'This is test content',
      filename: 'test.txt',
      mimeType: 'text/plain',
      size: 1024,
      uploadedBy: user,
      ...overrides
    });

    return documentRepository.save(document);
  }

  static generateJwtToken(jwtService: JwtService, user: User): string {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  static async getAuthToken(
    app: INestApplication,
    email: string,
    password: string,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    return response.body.data?.access_token || response.body.access_token;
  }
}
