import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

// Supabase's transaction pooler doesn't support prepared statements.
export const sql = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(sql, { schema });

export type DB = typeof db;
