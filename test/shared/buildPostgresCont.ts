import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource, DataSourceOptions } from 'typeorm';

const TEST_DB_NAME = 'lucky_db_test';
const TEST_DB_PASSWORD = '1234';
const TEST_DB_USERNAME = 'lucky_user_test';

export async function buildPostgresContainer(): Promise<
  [DataSource, StartedPostgreSqlContainer]
> {
  const pgContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase(TEST_DB_NAME)
    .withPassword(TEST_DB_PASSWORD)
    .withUsername(TEST_DB_USERNAME)
    .start();

  const host = pgContainer.getHost();
  const port = pgContainer.getPort();

  const options: DataSourceOptions = {
    type: 'postgres',
    host,
    port,
    username: TEST_DB_USERNAME,
    password: TEST_DB_PASSWORD,
    database: TEST_DB_NAME,
    entities: ['src/**/*.entity.ts'],
    synchronize: true,
    logging: false,
  };

  const testDataSource = new DataSource(options);
  await testDataSource.initialize();
  return [testDataSource, pgContainer];
}

export async function stopTestContainer(
  testDataSource: DataSource,
  pgContainer: StartedPostgreSqlContainer,
) {
  await pgContainer.stop();
  await testDataSource.destroy();
}
