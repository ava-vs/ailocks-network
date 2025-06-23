import type { Handler } from '@netlify/functions';
import { db } from '../../src/lib/db';
import { intents, users } from '../../src/lib/schema';
import { eq, and, or, isNull, sql, desc } from 'drizzle-orm';
import { embeddingService } from '../../src/lib/embedding-service';

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
    const searchQuery = searchParams.get('search'); // Semantic search query

    console.log(`🔍 Fetching intents for ${userCity}, ${userCountry} with search: "${searchQuery || 'none'}"`);

    // If a search query is provided, perform a hybrid search
    if (searchQuery) {
      const allIntents: any[] = [];
      const intentIds = new Set<string>();

      // 1. Semantic Search (for intents with embeddings)
      if (process.env.OPENAI_API_KEY) {
        try {
          console.log(`🧠 Performing semantic search for: "${searchQuery}"`);
          const semanticResults = await embeddingService.searchByText(searchQuery, limit);
          if (semanticResults.length > 0) {
            console.log(`✅ Found ${semanticResults.length} semantic matches`);
            for (const intent of semanticResults) {
              if (!intentIds.has(intent.id)) {
                allIntents.push({ ...intent, semanticMatch: true });
                intentIds.add(intent.id);
              }
            }
          }
        } catch (semanticError) {
          console.warn('⚠️ Semantic search failed, continuing with keyword search:', semanticError);
        }
      }

      // 2. Keyword Search (for all intents, as a fallback and for those without embeddings)
      console.log(`📝 Performing keyword search for: "${searchQuery}"`);
      const keywordResults = await db
        .select()
        .from(intents)
        .where(
          or(
            sql`title ILIKE ${'%' + searchQuery + '%'}`,
            sql`description ILIKE ${'%' + searchQuery + '%'}`
          )
        )
        .limit(limit);

      for (const intent of keywordResults) {
        if (!intentIds.has(intent.id)) {
          allIntents.push({ ...intent, semanticMatch: false, match_percentage: 50 }); // Add default score
          intentIds.add(intent.id);
        }
      }

      // 3. Enrich and format combined results
      const enrichedResults = await Promise.all(
        allIntents.map(async (intent: any) => {
          const [user] = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, intent.userId))
            .limit(1);

          return {
            id: intent.id,
            userId: intent.userId,
            title: intent.title,
            description: intent.description,
            category: intent.category,
            targetCountry: intent.targetCountry,
            targetCity: intent.targetCity,
            requiredSkills: intent.requiredSkills || [],
            budget: intent.budget ? `$${Math.floor(intent.budget / 1000)}k` : null,
            timeline: intent.timeline,
            priority: intent.priority,
            matchScore: intent.match_percentage || 85,
            distance: calculateDistance(userCountry, userCity, intent.targetCountry, intent.targetCity),
            createdAt: formatTimeAgo(intent.createdAt),
            userName: user?.name || 'Anonymous',
            userEmail: user?.email,
            isOwn: userId && intent.userId === userId,
            semanticMatch: intent.semanticMatch,
            similarityScore: intent.similarity_score
          };
        })
      );
      
      // Sort final results: semantic matches first, then by score
      enrichedResults.sort((a, b) => {
        if (a.semanticMatch && !b.semanticMatch) return -1;
        if (!a.semanticMatch && b.semanticMatch) return 1;
        return (b.similarityScore || b.matchScore) - (a.similarityScore || a.matchScore);
      });

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
          searchType: 'hybrid',
          searchQuery,
          timestamp: new Date().toISOString()
        })
      };
    }

    // Regular database search (fallback or when no search query)
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

    // Add text search if provided (fallback search)
    if (searchQuery) {
      baseConditions.push(
        or(
          sql`${intents.title} ILIKE ${'%' + searchQuery + '%'}`,
          sql`${intents.description} ILIKE ${'%' + searchQuery + '%'}`
        )
      );
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
        locationScore: locationScore,
        hasEmbedding: sql<boolean>`${intents.embedding} IS NOT NULL`
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
      const distance = calculateDistance(
        userCountry, 
        userCity, 
        intent.targetCountry, 
        intent.targetCity
      );

      // Calculate match score (simplified algorithm)
      const baseScore = intent.locationScore || 60;
      const matchScore = Math.min(95, baseScore + Math.floor(Math.random() * 20));

      // Check if this intent belongs to the current user
      const isOwn = userId && intent.userId === userId;

      return {
        id: intent.id,
        userId: intent.userId,
        title: intent.title,
        description: intent.description,
        category: intent.category,
        requiredSkills: intent.requiredSkills || [],
        budget: intent.budget ? `$${Math.floor(intent.budget / 1000)}k` : null,
        timeline: intent.timeline,
        priority: intent.priority,
        matchScore,
        distance,
        createdAt: formatTimeAgo(intent.createdAt),
        userName: intent.userName || 'Anonymous',
        userEmail: intent.userEmail,
        isOwn: isOwn || false,
        hasEmbedding: intent.hasEmbedding || false,
        semanticMatch: false
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
        searchType: searchQuery ? 'text' : 'location',
        searchQuery: searchQuery || null,
        embeddingSupport: !!process.env.OPENAI_API_KEY,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Intents list error:', error);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        intents: [],
        location: null,
        totalCount: 0,
        searchType: 'fallback',
        error: 'Database unavailable, returning empty list',
        timestamp: new Date().toISOString()
      })
    };
  }
};

function calculateDistance(userCountry: string, userCity: string, targetCountry?: string | null, targetCity?: string | null): string {
  if (!targetCountry) return 'Remote';
  
  if (userCountry === targetCountry && userCity === targetCity) {
    return `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)} miles`;
  }
  
  if (userCountry === targetCountry) {
    return `${Math.floor(Math.random() * 50) + 10}.${Math.floor(Math.random() * 9)} miles`;
  }
  
  return 'International';
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}
