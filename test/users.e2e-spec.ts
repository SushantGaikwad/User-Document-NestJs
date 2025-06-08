import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../src/common/entities/user.entity';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './helpers/test-helpers';
import { UserRole } from '../src/common/enums/user-role.enum';
import { testDatabaseConfig } from './test-database';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let viewerToken: string;
  let adminUser: User;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await TestHelpers.createTestingModule([
      AppModule,
    ]);

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
  let count= 4;

  beforeEach(async () => {
    try {
     await TestHelpers.truncateAllTables(dataSource);
      
      // Create admin user and get token
      adminUser = await TestHelpers.createTestUser(userRepository, {
        email: 'admin@example.com',
        role: UserRole.ADMIN
      });
      adminToken = await TestHelpers.getAuthToken(app, 'admin@example.com', 'password123');
      
      // Create viewer user and get token  
      const viewerUser = await TestHelpers.createTestUser(userRepository, {
        email: `viewer@example.com`,
        role: UserRole.VIEWER
      });
      viewerToken = await TestHelpers.getAuthToken(app, 'viewer@example.com', 'password123');
      
      // Create a test user to be used in operations
      testUser = await TestHelpers.createTestUser(userRepository, {
        email: `test@example.com`,
        role: UserRole.VIEWER
      });

      count++;
    } catch (error) {
      console.log('Setup error:', error.message);
    }
  });

  describe('/users (POST)', () => {
    it('should create a new user as admin', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.VIEWER,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.email).toBe(userData.email);
      expect(response.body.firstName).toBe(userData.firstName);
      expect(response.body.lastName).toBe(userData.lastName);
      expect(response.body.role).toBe(userData.role);
      expect(response.body.password).toBeUndefined(); // Password should not be returned
      expect(response.body.id).toBeDefined();
    });

    it('should return 403 when non-admin tries to create user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.VIEWER,
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(userData)
        .expect(403);
    });

    it('should return 401 when no token provided', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.VIEWER,
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(401);
    });

    it('should return 400 for invalid user data', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123', // too short
        firstName: '',
        lastName: '',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should get all users as admin with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.total).toBeDefined();
    //   expect(response.body.page).toBeDefined();
    //   expect(response.body.limit).toBeDefined();
      
      // Check that passwords are not returned
      response.body.users.forEach(user => {
        expect(user.password).toBeUndefined();
        expect(user.email).toBeDefined();
        expect(user.id).toBeDefined();
      });
    });

    it('should get users with custom pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);
    //   expect(response.body.limit).toBe(5);
      expect(response.body.pages).toBe(1);
    });

    it('should return 403 when non-admin tries to get users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update user as admin', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
    });

    it('should return 403 when non-admin tries to update user', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 400 for invalid UUID', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      await request(app.getHttpServer())
        .patch('/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .patch(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('/users/:id/role (PATCH)', () => {
    it('should update user role as admin', async () => {
      const updateRoleData = {
        role: UserRole.ADMIN,
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateRoleData)
        .expect(200);

      expect(response.body.role).toBe(UserRole.ADMIN);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.password).toBeUndefined();
    });

    it('should return 403 when non-admin tries to update role', async () => {
      const updateRoleData = {
        role: UserRole.ADMIN,
      };

      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(updateRoleData)
        .expect(403);
    });

    it('should return 400 for invalid role', async () => {
      const updateRoleData = {
        role: 'invalid-role',
      };

      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateRoleData)
        .expect(400);
    });
  });

  describe('/users/:id/deactivate (PATCH)', () => {
    it('should deactivate user as admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.password).toBeUndefined();
    });

    it('should return 403 when non-admin tries to deactivate user', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}/deactivate`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .patch(`/users/${nonExistentId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/users/:id/activate (PATCH)', () => {
    it('should activate user as admin', async () => {
      // First deactivate the user
      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Then activate the user
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.password).toBeUndefined();
    });

    it('should return 403 when non-admin tries to activate user', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}/activate`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .patch(`/users/${nonExistentId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete user as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify user is deleted
      const deletedUser = await userRepository.findOne({ 
        where: { id: testUser.id } 
      });
      expect(deletedUser).toBeNull();
    });

    it('should return 403 when non-admin tries to delete user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .delete('/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .delete(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .expect(401);
    });
  });

  describe('Token validation', () => {
    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 for malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'invalid-format')
        .expect(401);
    });
  });
});