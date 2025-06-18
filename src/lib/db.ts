import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Use Netlify's automatic DATABASE_URL if available, fallback to custom env
const sql = neon(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL!);
export const db = drizzle(sql, { schema });

export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type ChatSession = typeof schema.chatSessions.$inferSelect;
export type NewChatSession = typeof schema.chatSessions.$inferInsert;
export type Intent = typeof schema.intents.$inferSelect;
export type NewIntent = typeof schema.intents.$inferInsert;
export type SmartChain = typeof schema.smartChains.$inferSelect;
export type NewSmartChain = typeof schema.smartChains.$inferInsert;