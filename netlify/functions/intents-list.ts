import type { Handler } from '@netlify/functions';
import { db } from '../../src/lib/db';
import { intents, users } from '../../src/lib/schema';
import { eq, and, or, isNull, sql, desc } from 'drizzle-orm';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
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
    const { searchParams } = new URL(event.rawUrl);
    const userCountry = searchParams.get('userCountry') || 'US';
    const userCity = searchParams.get('userCity') || 'New York';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId'); // Get current user ID for ownership check

    // Build base query conditions
    const baseConditions = [
      or(
        eq(intents.targetCountry, userCountry),
        isNull(intents.targetCountry)
      ),
      eq(intents.status, 'active')
    ];

    // Add category filter if specified
    if (category && category !== 'all') {
      baseConditions.push(eq(intents.category, category));
    }

    const locationScore = sql<number>`
      CASE 
        WHEN ${intents.targetCountry} = ${userCountry} AND ${intents.targetCity} = ${userCity} THEN 100
        WHEN ${intents.targetCountry} = ${userCountry} THEN 80
        WHEN ${intents.targetCountry} IS NULL THEN 60
        ELSE 20
      END
    `;

    // Build query for location-aware matching
    const query = db
      .select({
        id: intents.id,
        userId: intents.userId,
        title: intents.title,
        description: intents.description,
        category: intents.category,
        targetCountry: intents.targetCountry,
        targetCity: intents.targetCity,
        requiredSkills: intents.requiredSkills,
        budget: intents.budget,
        timeline: intents.timeline,
        priority: intents.priority,
        createdAt: intents.createdAt,
        userName: users.name,
        userEmail: users.email,
        locationScore: locationScore
      })
      .from(intents)
      .leftJoin(users, eq(intents.userId, users.id))
      .where(and(...baseConditions))
      .orderBy(desc(locationScore), desc(intents.createdAt))
      .limit(limit);

    const results = await query;

    // Calculate additional metrics for each intent
    const enrichedResults = results.map(intent => {
      // Calculate distance based on location score
      let distance = 'Remote';
      if (intent.locationScore === 100) {
        distance = `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)} miles`;
      } else if (intent.locationScore === 80) {
        distance = `${Math.floor(Math.random() * 50) + 10}.${Math.floor(Math.random() * 9)} miles`;
      } else if (intent.locationScore === 60) {
        distance = 'Remote';
      } else {
        distance = 'International';
      }

      // Calculate match score (simplified algorithm)
      const matchScore = Math.min(95, intent.locationScore + Math.floor(Math.random() * 20));

      // Format created date
      const createdAt = intent.createdAt ? new Date(intent.createdAt) : new Date();
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      
      let timeAgo = '';
      if (diffHours < 1) {
        timeAgo = 'Just now';
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hours ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        timeAgo = `${diffDays} days ago`;
      }

      // Check if this intent belongs to the current user
      const isOwn = userId && intent.userId === userId;

      return {
        id: intent.id,
        userId: intent.userId,
        title: intent.title,
        description: intent.description,
        category: intent.category,
        requiredSkills: intent.requiredSkills || [],
        budget: intent.budget ? `$${(intent.budget / 1000).toFixed(0)}k` : null,
        timeline: intent.timeline,
        priority: intent.priority,
        matchScore,
        distance,
        createdAt: timeAgo,
        userName: intent.userName || 'Anonymous',
        userEmail: intent.userEmail,
        isOwn: isOwn || false // Add ownership flag
      };
    });

    // Sort by match score
    enrichedResults.sort((a, b) => b.matchScore - a.matchScore);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        intents: enrichedResults,
        location: { country: userCountry, city: userCity },
        totalCount: enrichedResults.length,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Intents list error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch intents',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};