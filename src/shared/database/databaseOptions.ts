import type { ConfigService } from '@nestjs/config';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

import { DATABASE_NAME_DEFAULT } from '../../constants.js';

const DB_PORT_DEFAULT = 5432;
const DB_USERNAME_DEFAULT = 'postgres';
const DB_PASSWORD_DEFAULT = 'postgres';
const DB_HOST_DEFAULT = 'localhost';

export type DatabaseEnv = {
	DB_HOST?: string;
	DB_PORT?: string;
	DB_USERNAME?: string;
	DB_PASSWORD?: string;
	DB_DATABASE?: string;
};

export type PostgresConnectionConfig = Pick<
	PostgresConnectionOptions,
	'type' | 'host' | 'port' | 'username' | 'password' | 'database'
>;

function parsePort(port: string | number | undefined, fallback: number): number {
	if (port === undefined || port === '') {
		return fallback;
	}
	const parsed = typeof port === 'number' ? port : Number.parseInt(port, 10);
	return Number.isNaN(parsed) ? fallback : parsed;
}

function readDatabaseEnv(env?: DatabaseEnv): DatabaseEnv {
	if (env !== undefined) {
		return env;
	}

	return {
		DB_HOST: process.env.DB_HOST,
		DB_PORT: process.env.DB_PORT,
		DB_USERNAME: process.env.DB_USERNAME,
		DB_PASSWORD: process.env.DB_PASSWORD,
		DB_DATABASE: process.env.DB_DATABASE,
	};
}

export function buildTypeOrmConnectionOptions(
	env?: DatabaseEnv,
): PostgresConnectionConfig {
	const source = readDatabaseEnv(env);

	return {
		type: 'postgres',
		host: source.DB_HOST ?? DB_HOST_DEFAULT,
		port: parsePort(source.DB_PORT, DB_PORT_DEFAULT),
		username: source.DB_USERNAME ?? DB_USERNAME_DEFAULT,
		password: source.DB_PASSWORD ?? DB_PASSWORD_DEFAULT,
		database: source.DB_DATABASE ?? DATABASE_NAME_DEFAULT,
	};
}

export function buildTypeOrmOptionsFromConfig(config: ConfigService) {
	return {
		...buildTypeOrmConnectionOptions({
			DB_HOST: config.get<string>('DB_HOST'),
			DB_PORT: config.get<string>('DB_PORT'),
			DB_USERNAME: config.get<string>('DB_USERNAME'),
			DB_PASSWORD: config.get<string>('DB_PASSWORD'),
			DB_DATABASE: config.get<string>('DB_DATABASE'),
		}),
		autoLoadEntities: true,
		synchronize: false,
	};
}
