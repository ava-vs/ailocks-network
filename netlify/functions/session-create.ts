import { chatService } from '../../src/lib/chat-service';

export default async (request: Request) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const body = await request.text();
    const { mode, language = 'en', userId } = JSON.parse(body || '{}');

    if (!mode) {
      return new Response(JSON.stringify({ error: 'Mode is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check for invalid userId values
    if (userId === 'loading' || userId === 'anonymous') {
      return new Response(JSON.stringify({ 
        error: 'Invalid user ID', 
        message: 'Please wait for user data to load before creating session',
        retry: true
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Create session in database
    const sessionId = await chatService.createSession(userId, mode, language);

    return new Response(JSON.stringify({ 
      sessionId,
      message: 'Session created successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Session creation error:', error);
    
    // Check if it's a user validation error
    if (error instanceof Error && error.message.includes('Invalid userId')) {
      return new Response(JSON.stringify({ 
        error: 'Invalid user data',
        message: 'Please wait for user data to load and try again',
        retry: true
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Fallback: create a simple session ID without database storage
    const fallbackSessionId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    return new Response(JSON.stringify({ 
      sessionId: fallbackSessionId,
      fallback: true,
      warning: 'Session created without database persistence',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};