import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.resolve(__dirname, 'db.sqlite');
const schemaFile = path.resolve(__dirname, 'schema.sql');

export const database = new Database(dbFile);

export function initializeDatabase() {
  const schema = fs.readFileSync(schemaFile, 'utf-8');
  database.exec(schema);
}

export type DatabaseInstance = typeof database;
