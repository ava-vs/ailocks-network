import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

function createDb() {
  const sql = neon(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL!);
  return drizzle(sql, { schema });
}

// Exported as mutable binding so other modules observe updates after refresh
export let db = createDb();

/**
 * Explicitly re-creates the Neon HTTP client and Drizzle instance.
 * Use this when a transient network error (e.g. `fetch failed`) occurs so
 * subsequent queries get a fresh connection. The function returns the new
 * db instance for convenience.
 */
export function refreshDbConnection() {
  db = createDb();
  return db;
}

export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type ChatSession = typeof schema.chatSessions.$inferSelect;
export type NewChatSession = typeof schema.chatSessions.$inferInsert;
export type Intent = typeof schema.intents.$inferSelect;
export type NewIntent = typeof schema.intents.$inferInsert;
export type SmartChain = typeof schema.smartChains.$inferSelect;
export type NewSmartChain = typeof schema.smartChains.$inferInsert;