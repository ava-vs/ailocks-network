'use client';

import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useEffect } from 'react';
import { searchIntents, createIntent, getAilockProfile, gainAilockXp } from '../lib/api';
import { getProfile, gainXp } from '../lib/ailock/api';
import { useUserSession } from '../hooks/useUserSession';
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
      const errorMessage = error ? String(error) : 'Unknown error';
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
          
          window.dispatchEvent(new CustomEvent('voice-search-results', { detail: { query, results } }));
          
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
  
  useEffect(() => {
    const { status, isListening, isSpeaking } = conversation as any;
    let voiceState: 'idle' | 'listening' | 'processing' | 'speaking' = 'idle';

    if (status === 'connecting' || status === 'disconnecting') {
      voiceState = 'processing';
    } else if (isListening) {
      voiceState = 'listening';
    } else if (isSpeaking) {
      voiceState = 'speaking';
    } else if (status === 'connected') {
      voiceState = 'idle'; 
    }

    window.dispatchEvent(new CustomEvent('voice-status-update', { detail: { status: voiceState } }));
  }, [(conversation as any).status, (conversation as any).isListening, (conversation as any).isSpeaking]);


  const handleToggleConversation = useCallback(async () => {
    const currentStatus = String(conversation.status);
    if (currentStatus === 'connected') {
      console.log('⏹️ Stopping conversation...');
      await conversation.endSession();
    } else if (currentStatus === 'disconnected' || currentStatus === 'error' || currentStatus === 'idle') {
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
    const handleToggle = () => handleToggleConversation();
    window.addEventListener('toggle-voice-agent', handleToggle);
    return () => {
      window.removeEventListener('toggle-voice-agent', handleToggle);
    };
  }, [handleToggleConversation]);

  // This component is now "headless" and renders nothing.
  return null;
}