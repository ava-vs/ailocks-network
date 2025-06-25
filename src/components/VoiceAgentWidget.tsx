'use client';

import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { searchIntents, createIntent, getAilockProfile, gainAilockXp } from '../lib/api';
import toast from 'react-hot-toast';

const AGENT_ID = import.meta.env.PUBLIC_AGENT_ID || import.meta.env.AGENT_ID;

const getSignedUrl = async (): Promise<string> => {
  const response = await fetch('/.netlify/functions/get-elevenlabs-signed-url');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get signed URL');
  }
  const { signedUrl } = await response.json();
  return signedUrl;
};

export default function VoiceAgentWidget() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ Voice agent connected');
      toast.success('🎤 Ailock активен!');
    },
    onDisconnect: () => {
      console.log('❌ Voice agent disconnected');
      toast('🔴 Агент отключился');
    },
    onMessage: (message: any) => {
      console.log('📨 Dispatching voice message to main chat:', message);
      // Отправляем каждое сообщение в основной чат
      window.dispatchEvent(new CustomEvent('add-message-to-chat', { detail: message }));
    },
    onError: (error: any) => {
      console.error('💥 Voice agent error:', error);
      const errorMessage = error ? String(error) : 'Неизвестная ошибка';
      toast.error('❌ Ошибка: ' + errorMessage);
    },
  });

  const startConversation = useCallback(async () => {
    // Сообщаем основному чату, что началась новая сессия
    window.dispatchEvent(new CustomEvent('voice-session-started'));
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Attempting to start conversation via signed URL...');
      const signedUrl = await getSignedUrl();
      console.log('✅ Got signed URL.');

      await conversation.startSession({
        signedUrl,
        clientTools: {
          search_intents: async ({ query }: any) => {
            console.log(`[Tool] 'search_intents' called with query: "${query}"`);

            // 1. Проверка входных данных
            if (typeof query !== 'string' || !query.trim()) {
              console.warn('[Tool] search_intents called with an invalid query.');
              return "Please provide a valid search query to find intents.";
            }

            try {
              // 2. Вызов нашего API
              const results = await searchIntents(query);
              console.log(`[Tool] Found ${results.length} results.`);

              // Отправляем ПОЛНЫЙ результат в боковую панель
              window.dispatchEvent(new CustomEvent('voice-search-results', { 
                detail: { query, results } 
              }));

              // Отправляем ТОП-3 результата для отображения в основном чате
              window.dispatchEvent(new CustomEvent('display-results-in-chat', { 
                detail: { intents: results.slice(0, 3) } 
              }));

              // 4. Формирование человекопонятного ответа для агента
              if (!results || results.length === 0) {
                return `I couldn't find any intents matching "${query}". You can try a different search or create a new intent.`;
              }
              
              const count = results.length;
              const topTitles = results.slice(0, 3).map((r: any) => r.title).join('; ');
              
              // Возвращаем текстовый ответ для LLM
              return `Found ${results.length} intents for "${query}". I have displayed the top results on the screen.`;

            } catch (error) {
              console.error('[Tool] The "search_intents" tool failed:', error);
              return JSON.stringify({ tool: 'search_intents', error: 'Search failed' });
            }
          },
        }
      });
    } catch (error) {
      console.error('💥 Failed to start conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Start error: ${errorMessage}`);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    try {
      console.log('⏹️ Stopping conversation...');
      await conversation.endSession();
    } catch (error) {
      console.error('💥 Error stopping conversation:', error);
    }
  }, [conversation]);

  // Проверяем тариф пользователя
  useEffect(() => {
    const userPlan = localStorage.getItem('userPlan') || 'free';
    if (userPlan === 'free') {
      setIsVisible(false);
      console.log('❌ Voice agent hidden - free plan');
    } else {
      console.log('✅ Voice agent visible - plan:', userPlan);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
        {/* Start Button */}
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected' || conversation.status === 'connecting'}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          title="Start Conversation"
        >
          <Mic size={24} />
        </button>

        {/* Stop Button */}
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          title="Stop Conversation"
        >
          <MicOff size={24} />
        </button>

        {/* Status Indicator */}
        <div className="bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full">
          {`Status: ${conversation.status || 'disconnected'}`}
        </div>
      </div>
    </>
  );
} 