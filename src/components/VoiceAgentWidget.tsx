'use client';

import { useConversation } from '@elevenlabs/react';
import { Mic } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { searchIntents, createIntent, getAilockProfile, gainAilockXp } from '../lib/api';
import { getProfile, gainXp } from '../lib/ailock/api';
import { useUserSession } from '../hooks/useUserSession';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

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
  const [isVisible, setIsVisible] = useState(true);
  const { currentUser } = useUserSession();
  const [ailockId, setAilockId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.id !== 'loading') {
      getProfile(currentUser.id)
        .then(profile => {
          if (profile) {
            setAilockId(profile.id);
          }
        })
        .catch(err => console.error("Failed to get Ailock ID for voice agent", err));
    }
  }, [currentUser]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ Voice agent connected');
      toast.success('🎤 Ailock Online!');
    },
    onDisconnect: () => {
      console.log('❌ Voice agent disconnected');
      toast('🔴 Ailock Off!');
    },
    onMessage: (message: any) => {
      console.log('📨 Dispatching voice message to main chat:', message);
      window.dispatchEvent(new CustomEvent('add-message-to-chat', { detail: message }));
      if (message.source === 'user' && ailockId) {
        gainXp(ailockId, 'voice_message_sent')
          .then(result => {
            if (result.success) {
              toast.success(`+${result.xpGained} XP (voice)`, { duration: 1500, icon: '🎙️' });
              window.dispatchEvent(new CustomEvent('ailock-profile-updated'));
            }
          })
          .catch(err => console.warn("Failed to gain XP for voice message", err));
      }
    },
    onError: (error: any) => {
      console.error('💥 Voice agent error:', error);
      const errorMessage = error ? String(error) : 'Неизвестная ошибка';
      toast.error('❌ Error: ' + errorMessage);
    },
    clientTools: {
      search_intents: async ({ query }: any) => {
        console.log(`[Tool] 'search_intents' called with query: "${query}"`);

        if (typeof query !== 'string' || !query.trim()) {
          console.warn('[Tool] search_intents called with an invalid query.');
          return "Please provide a valid search query to find intents.";
        }

        try {
          const results = await searchIntents(query);
          console.log(`[Tool] Found ${results.length} results.`);
          
          // Отправляем результаты в боковую панель (аналогично текстовому чату)
          window.dispatchEvent(new CustomEvent('voice-search-results', { detail: { query, results } }));
          
          // Отправляем интенты в чат через тот же механизм, что и текстовый чат
          window.dispatchEvent(new CustomEvent('voice-intents-found', { 
            detail: { 
              intents: results.slice(0, 3),
              query: query,
              source: 'voice'
            } 
          }));

          if (!results || results.length === 0) {
            return `I couldn't find any intents matching "${query}". You can try a different search or create a new intent.`;
          }
          
          return `Found ${results.length} intents for "${query}". I have displayed the top results on the screen.`;
        } catch (toolError) {
          console.error('[Tool] The "search_intents" tool failed:', toolError);
          return JSON.stringify({ tool: 'search_intents', error: 'Search failed' });
        }
      },
    }
  });

  const handleToggleConversation = useCallback(async () => {
    const currentStatus = String(conversation.status);
    if (currentStatus === 'connected') {
      console.log('⏹️ Stopping conversation...');
      await conversation.endSession();
    } else if (currentStatus === 'disconnected' || currentStatus === 'error') {
      console.log('🎤 Attempting to start conversation...');
      window.dispatchEvent(new CustomEvent('voice-session-started'));
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const signedUrl = await getSignedUrl();
        console.log('✅ Got signed URL.');
        await conversation.startSession({ signedUrl });
      } catch (err) {
        console.error('💥 Failed to start conversation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Failed to start: ${errorMessage}`);
      }
    }
  }, [conversation]);

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

  const getButtonAppearance = (currentStatus: typeof conversation.status): string => {
    switch (String(currentStatus)) {
      case 'connecting':
      case 'disconnecting':
        return 'bg-yellow-500 hover:bg-yellow-600 animate-pulse';
      case 'connected':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };
  
  const isDisabled = conversation.status === 'connecting' || conversation.status === 'disconnecting';

  return (
    <>
      <div className="fixed bottom-20 right-8 z-40 flex flex-col items-center gap-2">
        <button
          onClick={handleToggleConversation}
          disabled={isDisabled}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-colors duration-300",
            getButtonAppearance(conversation.status),
            isDisabled && "cursor-not-allowed opacity-70"
          )}
          title={conversation.status === 'connected' ? "Отключить агента" : "Активировать агента"}
        >
          <Mic size={24} />
        </button>
        <div className="bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full capitalize">
          {conversation.status || 'disconnected'}
        </div>
      </div>
    </>
  );
}