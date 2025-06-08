import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { testDatabaseConfig } from './test-database';

describe('Database Connection', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(testDatabaseConfig)],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should connect to test database', async () => {
    expect(dataSource.isInitialized).toBe(true);
  });

  it('should have created tables', async () => {
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    expect(tables.length).toBeGreaterThan(0);
  });
});
