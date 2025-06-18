import type { Handler } from '@netlify/functions';
import { aiService } from '../../src/lib/ai-service';

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
    // Check AI service health
    const healthCheck = await aiService.healthCheck();
    
    // Check environment variables
    const envCheck = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET
    };

    // Test a simple AI call
    let testResponse = null;
    try {
      testResponse = await aiService.generateResponse(
        [{ role: 'user', content: 'Say "AI is working" in exactly those words.' }],
        { complexity: 'simple', budget: 'free', language: 'en' }
      );
    } catch (testError) {
      console.error('AI test call failed:', testError);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'healthy',
        aiService: healthCheck,
        environment: envCheck,
        testResponse: testResponse ? 'success' : 'failed',
        testMessage: testResponse || 'Test call failed',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('AI health check error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
};