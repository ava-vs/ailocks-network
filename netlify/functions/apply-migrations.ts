import type { Handler } from '@netlify/functions';
import { db } from '../../src/lib/db';
import { migrate } from 'drizzle-orm/neon-http/migrator';

export const handler: Handler = async () => {
  try {
    console.log('🔄 Running migrations via Netlify Function...');
    // Apply migrations from ./drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'success', message: 'Migrations applied', timestamp: new Date().toISOString() })
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: (error as Error).message })
    };
  }
}; 