import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIOptions {
  model?: string;
  complexity: 'simple' | 'medium' | 'complex';
  budget: 'free' | 'standard' | 'premium';
  language?: string;
  mode?: string;
}

export class UnifiedAIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Anthropic if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Initialize OpenRouter as fallback
    if (!this.openai && !this.anthropic && process.env.OPENROUTER_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      });
    }
  }

  selectModel(options: AIOptions) {
    const { complexity, budget } = options;

    // Free tier - use OpenRouter or basic models
    if (budget === 'free') {
      return {
        provider: 'openai',
        model: this.openai?.baseURL?.includes('openrouter') 
          ? 'microsoft/wizardlm-2-8x22b' 
          : 'gpt-3.5-turbo',
        maxTokens: 500
      };
    }

    // Premium tier - use best models
    if (budget === 'premium' || complexity === 'complex') {
      if (this.anthropic) {
        return {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          maxTokens: 1000
        };
      }
      return {
        provider: 'openai',
        model: this.openai?.baseURL?.includes('openrouter') 
          ? 'anthropic/claude-3.5-sonnet' 
          : 'gpt-4o',
        maxTokens: 1000
      };
    }

    // Standard tier - balanced performance
    return {
      provider: 'openai',
      model: this.openai?.baseURL?.includes('openrouter') 
        ? 'openai/gpt-4o-mini' 
        : 'gpt-4o-mini',
      maxTokens: 750
    };
  }

  async generateResponse(
    messages: AIMessage[],
    options: AIOptions,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    // Check if any AI service is available
    if (!this.openai && !this.anthropic) {
      throw new Error('No AI service available. Please configure API keys.');
    }

    const selectedModel = this.selectModel(options);
    
    // Add system prompt based on mode
    const systemPrompt = this.getSystemPrompt(options.mode || 'researcher', options.language || 'en');
    const fullMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    try {
      if (selectedModel.provider === 'anthropic' && this.anthropic) {
        return await this.callAnthropic(fullMessages, selectedModel, onChunk);
      } else if (this.openai) {
        return await this.callOpenAI(fullMessages, selectedModel, onChunk);
      } else {
        throw new Error('No suitable AI provider available');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error; // Re-throw to allow fallback handling
    }
  }

  private async callOpenAI(
    messages: AIMessage[],
    model: any,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    if (onChunk) {
      // Streaming response
      const stream = await this.openai.chat.completions.create({
        model: model.model,
        messages: messages,
        max_tokens: model.maxTokens,
        temperature: 0.7,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }
      return fullResponse;
    } else {
      // Non-streaming response
      const response = await this.openai.chat.completions.create({
        model: model.model,
        messages: messages,
        max_tokens: model.maxTokens,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    }
  }

  private async callAnthropic(
    messages: AIMessage[],
    model: any,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic not initialized');
    }

    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    if (onChunk) {
      // Streaming response
      const stream = await this.anthropic.messages.create({
        model: model.model,
        max_tokens: model.maxTokens,
        system: systemMessage?.content || '',
        messages: conversationMessages,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const content = chunk.delta.text;
          fullResponse += content;
          onChunk(content);
        }
      }
      return fullResponse;
    } else {
      // Non-streaming response
      const response = await this.anthropic.messages.create({
        model: model.model,
        max_tokens: model.maxTokens,
        system: systemMessage?.content || '',
        messages: conversationMessages,
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    }
  }

  private getSystemPrompt(mode: string, language: string): string {
    const prompts = {
      en: {
        researcher: `You are an AI research assistant specializing in market analysis, trend identification, and data synthesis. You help users discover insights, analyze patterns, and make data-driven decisions. You communicate in a professional yet approachable manner, always backing your insights with reasoning. Provide actionable recommendations and cite relevant sources when possible. Focus on thorough research and evidence-based conclusions.`,
        creator: `You are a creative AI assistant that helps users bring their ideas to life. You excel at brainstorming, ideation, content creation, and project planning. You're enthusiastic, inspiring, and always ready to explore new possibilities while providing practical guidance. Focus on innovative solutions and creative problem-solving. Help users think outside the box while keeping solutions feasible.`,
        analyst: `You are a strategic AI analyst who excels at breaking down complex problems, identifying root causes, and developing actionable solutions. You think systematically, consider multiple perspectives, and provide clear, structured recommendations. Use frameworks and methodologies to analyze situations thoroughly. Focus on strategic thinking and data-driven insights.`
      },
      ru: {
        researcher: `Вы - ИИ-ассистент исследователь, специализирующийся на анализе рынка, выявлении трендов и синтезе данных. Вы помогаете пользователям находить инсайты, анализировать паттерны и принимать решения на основе данных. Общайтесь профессионально, но доступно, всегда подкрепляя свои выводы аргументацией. Предоставляйте практические рекомендации и ссылайтесь на релевантные источники когда возможно.`,
        creator: `Вы - креативный ИИ-ассистент, который помогает пользователям воплощать идеи в жизнь. Вы превосходно справляетесь с мозговым штурмом, генерацией идей, созданием контента и планированием проектов. Вы энтузиаст, вдохновляете и всегда готовы исследовать новые возможности, предоставляя практические советы. Фокусируйтесь на инновационных решениях и креативном решении проблем.`,
        analyst: `Вы - стратегический ИИ-аналитик, который превосходно разбирает сложные проблемы, выявляет первопричины и разрабатывает практические решения. Вы мыслите системно, рассматриваете множественные перспективы и предоставляете четкие, структурированные рекомендации. Используйте фреймворки и методологии для тщательного анализа ситуаций.`
      }
    };

    return prompts[language as keyof typeof prompts]?.[mode as keyof typeof prompts.en] || prompts.en.researcher;
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; providers: string[] }> {
    const availableProviders = [];
    
    if (this.openai) {
      availableProviders.push(this.openai.baseURL?.includes('openrouter') ? 'openrouter' : 'openai');
    }
    
    if (this.anthropic) {
      availableProviders.push('anthropic');
    }

    return {
      status: availableProviders.length > 0 ? 'available' : 'unavailable',
      providers: availableProviders
    };
  }
}

export const aiService = new UnifiedAIService();