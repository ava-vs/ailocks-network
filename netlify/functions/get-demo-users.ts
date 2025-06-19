import { db } from '../../src/lib/db';
import { users } from '../../src/lib/schema';
import { eq } from 'drizzle-orm';

export default async () => {
  return new Response(JSON.stringify({ message: 'Demo users endpoint' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}; 