import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'foodbridge.db');

export const db = new DatabaseSync(DB_PATH);

// Enable Foreign Keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Helper to execute query with parameters and return array of objects
 */
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Helper to execute query with parameters and return single object (or undefined)
 */
export function queryGet(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

/**
 * Helper to run insert/update/delete query
 */
export function queryRun(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Helper for running raw DDL script
 */
export function execScript(sql) {
  db.exec(sql);
}

export default db;
