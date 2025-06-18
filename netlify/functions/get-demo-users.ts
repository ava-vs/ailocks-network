import { db } from '../../src/lib/db';
import { users } from '../../src/lib/schema';
import { eq } from 'drizzle-orm';

export default async (request: Request) => {
  console.log('🔍 Getting demo users from database...');
  
  try {
    // Получаем демо-пользователей из БД по email
    const lireaResult = await db.select().from(users)
      .where(eq(users.email, 'lirea.designer@example.com'))
      .limit(1);
    
    const marcoResult = await db.select().from(users)
      .where(eq(users.email, 'marco.manager@fintechrio.com'))
      .limit(1);
    
    const demoUsers = [...lireaResult, ...marcoResult];
    
    console.log(`📋 Found ${demoUsers.length} demo users in database:`, demoUsers);
    
    // Преобразуем в формат, ожидаемый клиентом
    const formattedUsers = demoUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      country: user.country,
      city: user.city,
      timezone: user.timezone,
      languages: user.languages || [],
      avatar: user.name === 'Lirea' 
        ? '/api/placeholder/120/120?text=L' 
        : '/api/placeholder/120/120?text=M'
    }));

    return new Response(JSON.stringify({
      success: true,
      users: formattedUsers,
      message: `Found ${formattedUsers.length} demo users`,
      debug: {
        lireaFound: lireaResult.length > 0,
        marcoFound: marcoResult.length > 0,
        totalUsers: demoUsers.length,
        lireaId: lireaResult.length > 0 ? lireaResult[0].id : null,
        marcoId: marcoResult.length > 0 ? marcoResult[0].id : null
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    });

  } catch (error) {
    console.error('❌ Error getting demo users:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      users: [],
      fallback: true
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}; 