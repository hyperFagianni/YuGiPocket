import * as SQLite from 'expo-sqlite';
import { SCHEMA_STATEMENTS } from './schema';

const DB_NAME = 'yugipocket.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.withTransactionAsync(async () => {
    for (const statement of SCHEMA_STATEMENTS) {
      await db.execAsync(statement);
    }
  });
  return db;
}

/** Returns the shared, migrated database instance, opening it on first call. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}
