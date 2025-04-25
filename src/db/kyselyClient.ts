import { Kysely, MysqlDialect } from 'kysely';
import { DB } from './schema';
import mysql from 'mysql2';

export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'inventory_data',
    })
  })
});