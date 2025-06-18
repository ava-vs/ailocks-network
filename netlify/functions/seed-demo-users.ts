import type { Handler } from '@netlify/functions';
import { db } from '../../src/lib/db';
import { users } from '../../src/lib/schema';
import { eq } from 'drizzle-orm';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('🔄 Seeding demo users...');

    // Define demo users with fixed UUIDs that match the frontend
    const demoUsersData = [
      {
        id: 'd9c1b3a3-b4e8-4b5a-9b4b-9b4b9b4b9b4a', // Lirea's fixed UUID
        email: 'lirea.designer@example.com',
        name: 'Lirea',
        country: 'BR',
        city: 'Rio de Janeiro',
        timezone: 'America/Sao_Paulo',
        languages: ['pt', 'en']
      },
      {
        id: 'a8b2c4d5-e6f7-4a9b-8c1d-8c1d8c1d8c1d', // Marco's fixed UUID
        email: 'marco.manager@fintechrio.com',
        name: 'Marco',
        country: 'BR',
        city: 'Rio de Janeiro',
        timezone: 'America/Sao_Paulo',
        languages: ['pt', 'en']
      }
    ];

    const results = [];

    // Check if users already exist and create/update them
    for (const userData of demoUsersData) {
      try {
        // Try to find existing user
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.id, userData.id))
          .limit(1);

        if (existingUser.length > 0) {
          // Update existing user
          const [updatedUser] = await db
            .update(users)
            .set({
              email: userData.email,
              name: userData.name,
              country: userData.country,
              city: userData.city,
              timezone: userData.timezone,
              languages: userData.languages,
              updatedAt: new Date()
            })
            .where(eq(users.id, userData.id))
            .returning();
          
          console.log(`✅ Updated existing user: ${userData.name} (${userData.id})`);
          results.push({ action: 'updated', user: updatedUser });
        } else {
          // Insert new user with specific ID
          const [newUser] = await db.insert(users).values({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            country: userData.country,
            city: userData.city,
            timezone: userData.timezone,
            languages: userData.languages
          }).returning();
          
          console.log(`✅ Created new user: ${userData.name} (${userData.id})`);
          results.push({ action: 'created', user: newUser });
        }
      } catch (userError) {
        console.error(`❌ Failed to create/update user ${userData.name}:`, userError);
        results.push({ action: 'failed', error: userError instanceof Error ? userError.message : 'Unknown error', userData });
      }
    }

    // Verify users exist
    const allUsers = await db.select().from(users);
    const demoUserIds = demoUsersData.map(u => u.id);
    const existingDemoUsers = allUsers.filter(u => demoUserIds.includes(u.id));

    console.log(`✅ Demo users seeded successfully. Found ${existingDemoUsers.length} demo users in database.`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Demo users seeded successfully',
        results,
        existingDemoUsers: existingDemoUsers.map(u => ({ id: u.id, name: u.name, email: u.email })),
        totalUsers: allUsers.length,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Demo user seeding failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to seed demo users',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};