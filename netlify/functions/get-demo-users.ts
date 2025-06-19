import type { Handler } from '@netlify/functions';
import { db } from '../../src/lib/db';
import { users } from '../../src/lib/schema';
import { inArray } from 'drizzle-orm';

// Hard-coded fallback users to ensure the frontend works even if the database is
// not reachable (e.g. when developing offline or Neon is down).
const FALLBACK_USERS = [
  {
    id: 'd9c1b3a3-b4e8-4b5a-9b4b-9b4b9b4b9b4a',
    name: 'Lirea',
    email: 'lirea.designer@example.com',
    country: 'BR',
    city: 'Rio de Janeiro',
    timezone: 'America/Sao_Paulo',
  },
  {
    id: 'a8b2c4d5-e6f7-4a9b-8c1d-8c1d8c1d8c1d',
    name: 'Marco',
    email: 'marco.manager@fintechrio.com',
    country: 'BR',
    city: 'Rio de Janeiro',
    timezone: 'America/Sao_Paulo',
  },
] as const;

export const handler: Handler = async () => {
  try {
    // Try to fetch the two demo users by their well-known emails.
    const demoUsers = await db
      .select()
      .from(users)
      .where(inArray(users.email, FALLBACK_USERS.map((u) => u.email)));

    if (demoUsers.length === 2) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, users: demoUsers }),
      };
    }

    // Database reachable, but demo users not found – return empty to let the
    // frontend decide whether to call `seed-demo-users`.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, users: demoUsers }),
    };
  } catch (error) {
    console.error('⚠️ get-demo-users DB error, falling back to static data:', error);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, users: FALLBACK_USERS }),
    };
  }
}; 