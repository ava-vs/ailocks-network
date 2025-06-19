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
    // 1. Проверить состояние всех AI-провайдеров
    const health = await aiService.healthCheck();
    const isAnyProviderAvailable = health.providers && health.providers.length > 0;

    // 2. Если НИ ОДИН провайдер не отвечает - вернуть ошибку
    if (!isAnyProviderAvailable) {
      return {
        statusCode: 503, // Service Unavailable
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'error',
          message: 'Все AI сервисы недоступны. Проверьте API ключи в Netlify.',
          details: health.providers,
          environment: {
            OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
            ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
            OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY
          },
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // 3. Сделать быстрый тестовый звонок к самому дешевому провайдеру
    let testResponse = null;
    let testError = null;
    
    try {
      // Используем timeout для предотвращения долгого ожидания
      const testPromise = aiService.generateResponse(
        [{ role: 'user', content: 'Health check' }],
        { complexity: 'simple', budget: 'free' } // Гарантирует использование OpenRouter
      );
      
      // Timeout через 8 секунд чтобы не превысить лимит Netlify
      testResponse = await Promise.race([
        testPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]);
    } catch (error) {
      testError = error instanceof Error ? error.message : 'Unknown error';
      console.error('AI test call failed:', error);
    }

    if (testResponse) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'healthy',
          message: 'Как минимум один AI провайдер работает.',
          details: health.providers,
          testCallSuccess: true,
          testMessage: testResponse,
          environment: {
            OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
            ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
            OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY
          },
          timestamp: new Date().toISOString()
        })
      };
    } else {
      // 4. Если даже тестовый звонок не прошел - сообщить об этом
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'error',
          message: 'Тестовый вызов AI провалился. Проверьте конфигурацию OpenRouter.',
          error: testError,
          details: health.providers,
          testCallSuccess: false,
          environment: {
            OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
            ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
            OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY
          },
          timestamp: new Date().toISOString()
        })
      };
    }

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