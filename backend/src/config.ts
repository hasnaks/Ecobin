import 'dotenv/config';
import { join } from 'path';

export const JWT_SECRET = process.env.JWT_SECRET || 'ecobin-dev-secret-change-me';

// Primary: hosted PostgreSQL (e.g. Neon) via a standard connection string.
// Fallback: local SQLite file when DATABASE_URL is not set (dev/CI without cloud creds).
export const DATABASE_URL = (process.env.DATABASE_URL || '').trim();
export const DB_PATH = process.env.DB_PATH || join(process.cwd(), 'data', 'ecobin.sqlite');
