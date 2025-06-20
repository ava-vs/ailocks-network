import { UnifiedAIService } from '../../src/lib/ai-service';
import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const aiService = new UnifiedAIService();

  try {
    const health = await aiService.healthCheck();
    
    // Perform a simple test query
    const testResponse = await aiService.generateWithCostOptimization(
        [{ role: 'user', content: 'Hello' }],
        { complexity: 'simple', budget: 'free' }
    );

    const isHealthy = health.status === 'ok' && testResponse.length > 0;

    return {
      statusCode: isHealthy ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: isHealthy ? 'ok' : 'error',
        aiService: health,
        testResponse: testResponse.length > 0 ? 'success' : 'failed'
      }),
    };
  } catch (error: any) {
    console.error('AI Health Check failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        message: 'An error occurred during the health check.',
        error: error.message,
      }),
    };
  }
};