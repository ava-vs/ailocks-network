import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Mic, Bot, MessageCircle, Copy, Plus, MapPin, TrendingUp, Users, CheckCircle, XCircle, Loader, ArrowRight, BrainCircuit, Search, DraftingCompass, Eye } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { appState, setMode, setLanguage, type AIMode, type Language } from '../../lib/store';
import { useUserSession } from '../../hooks/useUserSession';
import { useLocation } from '../../hooks/useLocation';
import MessageBubble from './MessageBubble';
import IntentPreview from './IntentPreview';
import { getProfile, gainXp } from '../../lib/ailock/api';
import type { FullAilockProfile } from '../../lib/ailock/core';
import LevelUpModal from '../Ailock/LevelUpModal';
import { searchIntents } from '../../lib/api';
import toast from 'react-hot-toast';
import VoiceAgentClientWrapper from '../VoiceAgentClientWrapper';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  mode: string;
  intents?: IntentCard[];
}

interface SuggestedAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  priority: string;
}

interface IntentCard {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  budget?: string;
  timeline?: string;
  priority: string;
  matchScore: number;
  distance: string;
  targetCity?: string;
  targetCountry?: string;
}

interface IntentPreviewData {
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  budget?: string;
  timeline?: string;
  priority: string;
}

export default function ChatInterface() {
  const state = useStore(appState);
  const { activeMode: mode, language } = state;

  const { currentUser, demoUsers, isHydrated, isLoading: isUserLoading } = useUserSession();
  const location = useLocation();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [showIntentPreview, setShowIntentPreview] = useState(false);
  const [intentPreview, setIntentPreview] = useState<IntentPreviewData | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [ailockStatus, setAilockStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');
  const [demoUsersSeeded, setDemoUsersSeeded] = useState(false);
  const [ailockProfile, setAilockProfile] = useState<FullAilockProfile | null>(null);
  const [ailockId, setAilockId] = useState<string | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number, skillPointsGained: number, xpGained: number } | null>(null);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [newLevelInfo, setNewLevelInfo] = useState({ level: 0, xp: 0, skillPoints: 0 });
  const [showChatHistoryMessage, setShowChatHistoryMessage] = useState(false);
  
  // Voice Agent Integration
  // Voice agent will be rendered as separate client component
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showIntentPreview]);

  // Seed demo users on component mount
  useEffect(() => {
    const seedDemoUsers = async () => {
      if (demoUsers.lirea && demoUsers.marco) {
        try {
          console.log('🌱 Seeding demo users...');
          const response = await fetch('/.netlify/functions/seed-demo-users', {
            method: 'POST',
            body: JSON.stringify({ success: true, users: [demoUsers.lirea, demoUsers.marco] }),
          });
          
          if (response.ok) {
            await response.json();
            console.log('✅ Demo users seeded successfully.');
            setDemoUsersSeeded(true);
          } else {
            let errorMsg = `Request failed with status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (jsonError) {
                // The body was not valid JSON
            }
            console.error('❌ Failed to seed demo users:', errorMsg);
            toast.error(`Failed to seed demo users: ${errorMsg}`);
          }
        } catch (error: any) {
          console.error('❌ Failed to seed demo users:', error);
          toast.error('Failed to seed demo users.');
        }
      }
    };

    seedDemoUsers();
  }, [demoUsers]);

  // Check Ailock service health on component mount
  useEffect(() => {
    const checkAilockHealth = async () => {
      try {
        const response = await fetch('/.netlify/functions/ai-health-check');
        if (response.ok) {
          const data = await response.json();
          console.log('Ailock Health Check:', data);
          
          if (data.aiService?.status === 'available' && data.testResponse === 'success') {
            setAilockStatus('available');
            setError(null);
          } else {
            setAilockStatus('unavailable');
            setError('Ailock services are not properly configured.');
          }
        } else {
          setAilockStatus('unavailable');
          setError('Ailock health check failed.');
        }
      } catch (err) {
        console.warn('Ailock health check error:', err);
        setAilockStatus('unavailable');
        setError('Cannot connect to Ailock services.');
      }
    };

    checkAilockHealth();
  }, []);

  // Initialize session with user ID - only after demo users are seeded
  useEffect(() => {
    const initSession = async () => {
      if (!demoUsersSeeded || !currentUser.id || currentUser.id === 'loading') {
        console.log('⏳ Waiting for demo users to be seeded or user to be available...', {
          demoUsersSeeded,
          userId: currentUser.id,
          isLoading: currentUser.id === 'loading'
        });
        return;
      }

      try {
        setConnectionStatus('connecting');
        console.log('🔄 Creating session for user:', currentUser.id);
        
        const response = await fetch('/.netlify/functions/session-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            mode, 
            language, 
            userId: currentUser.id
          })
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          setConnectionStatus('connected');
          
          if (data.fallback) {
            console.warn('Session created in fallback mode:', data.warning);
            setError('Session created without persistent storage');
          } else {
            console.log('✅ Session created with database persistence:', data.sessionId);
            setError(null);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      } catch (err) {
        console.warn('Session initialization error:', err);
        const mockSessionId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setSessionId(mockSessionId);
        setConnectionStatus('connected');
        setError('Session created in offline mode - messages will not be saved');
      }
    };

    initSession();
  }, [mode, language, currentUser.id, demoUsersSeeded]);

  // Load chat history when session is created
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!sessionId || sessionId.startsWith('local-') || sessionId.startsWith('fallback-')) {
        return;
      }

      try {
        console.log('📥 Loading chat history in background for session:', sessionId);
        const response = await fetch(`/.netlify/functions/chat-history?sessionId=${sessionId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            const loadedMessages = data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(loadedMessages);
            console.log('✅ Background chat history loaded:', loadedMessages.length, 'messages');
          } else {
            console.log('📭 No chat history found for this session.');
          }
        } else {
          console.warn(`⚠️ Failed to load chat history in background: ${response.status}`);
        }
      } catch (error) {
        console.warn('Failed to load chat history in background:', error);
      }
    };

    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId]);

  useEffect(() => {
    if (currentUser && currentUser.id !== 'loading') {
      console.log('Current user is valid, fetching profile:', currentUser.name);
      getProfile(currentUser.id)
        .then(profile => {
          setAilockProfile(profile);
          if (profile) {
            setAilockId(profile.id);
          }
        })
        .catch((err: any) => {
          console.error("Failed to load Ailock profile", err);
          toast.error("Could not load Ailock profile.");
        });
    } else {
      console.log('User is not ready, skipping profile fetch.');
    }
  }, [currentUser.id]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
      mode
    };

    setMessages(prev => [...prev, userMessage]);
    setLastUserMessage(input.trim());
    setInput('');
    setIsStreaming(true);
    setError(null);
    setSuggestedActions([]);

    // Immediately grant XP for the text message (mirrors voice behaviour)
    handleXpGain();

    try {
      await sendAilockMessage(userMessage);
    } catch (err) {
      console.warn('Ailock request failed, using fallback:', err);
      await sendFallbackMessage();
    }
  };

  const sendAilockMessage = async (userMessage: Message) => {
    return new Promise<void>((resolve, reject) => {
      const response = fetch('/.netlify/functions/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          mode,
          language,
          location: location,
          userId: currentUser.id === 'loading' ? undefined : currentUser.id,
          streaming: true
        })
      });

      response.then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        if (!res.body) {
          throw new Error('No response body');
        }

        const reader = res.body.getReader();
        
        let assistantMessage: Message = {
          id: `${Date.now()}-ai`,
          content: '',
          role: 'assistant',
          timestamp: new Date(),
          mode
        };

        setMessages(prev => [...prev, assistantMessage]);
        setStreamingMessageId(assistantMessage.id);

        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                setIsStreaming(false);
                setStreamingMessageId(null);
                setAilockStatus('available');
                setError(null);
                console.log('✅ Message conversation saved to database');
                resolve();
                return;
              }

              const decodedChunk = new TextDecoder().decode(value);
              const lines = decodedChunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  if (data === '[DONE]') {
                    setIsStreaming(false);
                    setStreamingMessageId(null);
                    setAilockStatus('available');
                    setError(null);
                    console.log('✅ Message conversation saved to database');
                    resolve();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.type === 'chunk') {
                      setMessages(prev => prev.map(msg => 
                        msg.id === assistantMessage.id 
                          ? { ...msg, content: msg.content + parsed.content } 
                          : msg
                      ));
                    } else if (parsed.type === 'complete') {
                      setMessages(prev => prev.map(msg => 
                        msg.id === assistantMessage.id 
                          ? { ...msg, content: parsed.fullResponse } 
                          : msg
                      ));
                    } else if (parsed.type === 'intents') {
                      // Send all results to the side panel
                      window.dispatchEvent(new CustomEvent('text-search-results', { 
                        detail: { 
                          query: lastUserMessage,
                          results: parsed.intents 
                        } 
                      }));
                      
                      // Attach top 3 results to the message for rendering in chat
                      setMessages(prev => prev.map(msg => 
                        msg.id === assistantMessage.id 
                          ? { ...msg, intents: parsed.intents.slice(0, 3) } 
                          : msg
                      ));
                    } else if (parsed.type === 'actions') {
                      setSuggestedActions(parsed.actions);
                    } else if (parsed.type === 'error') {
                      setError(parsed.error);
                      if (parsed.fallback) {
                        setMessages(prev => prev.map(msg => 
                          msg.id === assistantMessage.id 
                            ? { ...msg, content: parsed.fallback } 
                            : msg
                        ));
                      }
                      setAilockStatus('unavailable');
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse SSE data:', parseError);
                  }
                }
              }
            }
          } catch (streamError) {
            console.error('Stream reading error:', streamError);
            reject(streamError);
          }
        };

        readStream();
      }).catch(reject);
    });
  };

  const sendFallbackMessage = async () => {
    setAilockStatus('unavailable');
    
    const assistantMessage: Message = {
      id: `${Date.now()}-ai`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      mode
    };

    setMessages(prev => [...prev, assistantMessage]);
    
    const fallbackContent = getMockResponse(mode, language);
    let currentContent = '';
    
    for (let i = 0; i < fallbackContent.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      currentContent += fallbackContent[i];
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id ? { ...msg, content: currentContent } : msg
      ));
    }
    
    setError('Ailock services unavailable - using offline responses.');
    setIsStreaming(false);
    setStreamingMessageId(null);

    // Grant XP even when using fallback (offline) response
    handleXpGain();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCreateIntent = async () => {
    if (!sessionId || !intentPreview) return;
    
    if (!currentUser.id || currentUser.id === 'loading') {
      setError('Please wait for user data to load before creating intents');
      return;
    }

    setIsCreatingIntent(true);
    try {
      const response = await fetch('/.netlify/functions/intents-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userInput: lastUserMessage,
          location,
          language,
          intentData: intentPreview,
          userId: currentUser.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const successMessage: Message = {
          id: `${Date.now()}-system`,
          content: `✅ Intent created successfully: "${data.intent.title}". Your collaboration opportunity is now live and visible to potential partners!`,
          role: 'assistant',
          timestamp: new Date(),
          mode
        };

        setMessages(prev => [...prev, successMessage]);
        
        window.dispatchEvent(new CustomEvent('intentCreated', { 
          detail: { 
            ...data.intent, 
            userId: currentUser.id,
            userName: currentUser.name,
            isOwn: true
          } 
        }));
        
        setSuggestedActions(prev => prev.filter(action => action.id !== 'create-intent'));
        
        setShowIntentPreview(false);
        setIntentPreview(null);
      } else {
        throw new Error('Failed to create intent');
      }
    } catch (error) {
      setError('Failed to create intent. Please try again.');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handleCancelIntent = () => {
    setShowIntentPreview(false);
    setIntentPreview(null);
  };

  const handleIntentCardClick = (intent: IntentCard) => {
    console.log('Intent card clicked:', intent);
    const message = `Tell me more about "${intent.title}" - this looks interesting!`;
    setInput(message);
    inputRef.current?.focus();
  };

  // Voice Ailock Component with real ElevenLabs integration
  const VoiceAilock = () => {
    // Voice agent will be rendered as separate client component in VoiceAgentWidget
    return (
      <div className="relative">
        <img src="/images/ailock-character.png" 
             className="w-24 h-24 object-contain transition-all duration-300 hover:scale-105"
             alt="Ailock" 
             style={{aspectRatio: '1/1', border: 'none', outline: 'none'}} />
      </div>
    );
  };

  const getModeDescription = (mode: string) => {
    const descriptions: Record<string, Record<string, string>> = {
      en: {
        researcher: 'I excel at finding collaboration opportunities and analyzing market data.',
        creator: 'I help you find creative collaborators and bring innovative ideas to life.',
        analyst: 'I provide strategic analysis of opportunities and market insights.'
      },
      ru: {
        researcher: 'Я превосходно нахожу возможности для сотрудничества и анализирую рыночные данные.',
        creator: 'Я помогаю находить творческих соавторов и воплощать инновационные идеи в жизнь.',
        analyst: 'Я предоставляю стратегический анализ возможностей и рыночные инсайты.'
      }
    };

    return descriptions[language]?.[mode] || descriptions.en.researcher;
  };

  const getWelcomeText = () => {
    const texts: Record<string, Record<string, string>> = {
      en: {
        welcome: "Hello! I'm Ailock, your personal AI assistant.",
      },
      ru: {
        welcome: "Привет! Я Айлок, ваш персональный ИИ-помощник.",
      }
    };

    return texts[language] || texts.en;
  };

  const getPlaceholder = () => {
    const placeholders: Record<string, string> = {
      en: `Ask Ailock to find opportunities, analyze markets, or help with collaboration...`,
      ru: `Попросите Айлока найти возможности, проанализировать рынки или помочь с сотрудничеством...`
    };

    return placeholders[language] || placeholders.en;
  };

  const getMockResponse = (mode: string, language: string): string => {
    const responses: Record<string, Record<string, string[]>> = {
      en: {
        researcher: [
          "I'm Ailock, your personal AI assistant. I help you find collaboration opportunities and analyze market trends. I'm currently having trouble accessing the database, but I can still help you create new opportunities.",
        ],
        creator: [
          "I'm Ailock, your creative AI companion! I help you find collaborators and bring ideas to life. While I'm having some technical difficulties, I can still help you brainstorm and create new opportunities.",
        ],
        analyst: [
          "I'm Ailock, your strategic AI advisor. I analyze opportunities and provide insights. I'm currently experiencing some connectivity issues, but I can still help you plan and strategize.",
        ]
      },
      ru: {
        researcher: [
          "Я Айлок, ваш персональный ИИ-помощник. Я помогаю находить возможности для сотрудничества и анализировать рыночные тренды. У меня проблемы с доступом к базе данных, но я все еще могу помочь создать новые возможности.",
        ],
        creator: [
          "Я Айлок, ваш творческий ИИ-компаньон! Я помогаю находить соавторов и воплощать идеи в жизнь. Хотя у меня технические трудности, я все еще могу помочь с мозговым штурмом и созданием новых возможностей.",
        ],
        analyst: [
          "Я Айлок, ваш стратегический ИИ-советник. Я анализирую возможности и предоставляю инсайты. У меня проблемы с подключением, но я все еще могу помочь с планированием и стратегией."
        ]
      }
    };

    const modeResponses = responses[language]?.[mode] || responses.en.researcher;
    const randomResponse = modeResponses[Math.floor(Math.random() * modeResponses.length)];
    
    return `${randomResponse}\n\n*Note: Using offline mode - Ailock services may be temporarily unavailable.*`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getActionIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Eye, MessageCircle, Copy, Plus, MapPin, TrendingUp, Users, DraftingCompass
    };
    const IconComponent = icons[iconName] || Eye;
    return <IconComponent className="w-4 h-4" />;
  };

  const isPersistentSession = sessionId && !sessionId.startsWith('local-') && !sessionId.startsWith('fallback-');

  // Show chat history message for 3 seconds when session becomes persistent
  useEffect(() => {
    if (isPersistentSession) {
      setShowChatHistoryMessage(true);
      const timer = setTimeout(() => {
        setShowChatHistoryMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isPersistentSession]);

  const handleXpGain = async () => {
    if (!ailockId) {
      console.error("Cannot gain XP: Ailock ID is missing.", { ailockId, currentUser: currentUser.id });
      return;
    }

    try {
        const result = await gainXp(ailockId, 'chat_message_sent');
        if (result.success) {
            toast.success(`+${result.xpGained} XP`, { duration: 1500, icon: '✨' });
            
            setAilockProfile(prev => prev ? {...prev, xp: result.new_xp} : null);

            if (result.leveledUp) {
                setLevelUpInfo({
                    newLevel: result.newLevel,
                    skillPointsGained: result.skillPointsGained,
                    xpGained: result.xpGained
                });
                setAilockProfile(prev => prev ? {...prev, level: result.newLevel, skillPoints: (prev.skillPoints || 0) + result.skillPointsGained} : null);
            }

            // Notify other components about profile update
            window.dispatchEvent(new CustomEvent('ailock-profile-updated'));
        }
    } catch (error) {
        console.error("Failed to gain XP", error);
        toast.error("Failed to record XP gain");
    }
  };

  const handleModeChange = (newMode: AIMode) => {
    setMode(newMode);
    setInput('');
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setInput('');
  };

  useEffect(() => {
    // Handler for text messages from voice
    const handleVoiceMessage = (event: CustomEvent) => {
      const { source, message } = event.detail;
      const role = source === 'user' ? 'user' : 'assistant';
      const newMessage: Message = { 
        role, 
        content: message, 
        id: Date.now().toString(),
        timestamp: new Date(),
        mode: 'text'
      };
      setMessages(prev => [...prev, newMessage]);
    };

    // Handler for voice intents - keep our voice agent functionality
    const handleVoiceIntents = (event: CustomEvent) => {
      const { intents, query, source } = event.detail;
      
      if (intents && intents.length > 0) {
        const voiceResultsMessage: Message = { 
          role: 'assistant', 
          content: `🎤 Я нашел ${intents.length} возможностей по запросу "${query}":`,
          intents: intents,
          id: Date.now().toString(),
          timestamp: new Date(),
          mode: mode,
        };
        setMessages(prev => [...prev, voiceResultsMessage]);
        
        // Также отправляем уведомление о том, что результаты найдены голосовым агентом
        console.log(`Voice agent found ${intents.length} intents for "${query}"`);
      }
    };

    // Handler for session start
    const handleVoiceSessionStart = () => {
      console.log('Voice session started, notified main chat.');
    };

    window.addEventListener('add-message-to-chat', handleVoiceMessage as EventListener);
    window.addEventListener('voice-intents-found', handleVoiceIntents as EventListener);
    window.addEventListener('voice-session-started', handleVoiceSessionStart as EventListener);

    return () => {
      window.removeEventListener('add-message-to-chat', handleVoiceMessage as EventListener);
      window.removeEventListener('voice-intents-found', handleVoiceIntents as EventListener);
      window.removeEventListener('voice-session-started', handleVoiceSessionStart as EventListener);
    };
  }, []); // Empty dependency array to run once

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-8 ml-16 mr-16 min-h-[calc(100vh-120px)]"
               style={{
                 background: 'radial-gradient(ellipse at center, rgba(74, 158, 255, 0.03) 0%, transparent 70%)',
                 backdropFilter: 'blur(1px)'
               }}>
            <div className="max-w-5xl w-full flex items-center gap-10">
              {/* AILOCK CHARACTER ON LEFT */}
              <div className="flex-shrink-0">
                {/* CRITICAL FIX 5: Voice Activation for Central Ailock */}
                <VoiceAilock />
              </div>
              
              {/* TEXT CONTENT ON RIGHT */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4 text-white">
                  {getWelcomeText().welcome}
                </h1>
                <p className="text-gray-300 mb-2 text-lg">
                  I'm here to help you in <span className="text-blue-400 font-medium">{mode}</span> mode.
                </p>
                <p className="text-gray-400 mb-8 text-base">
                  {getModeDescription(mode)}
                </p>
                
                {/* CHAT INPUT - CLEAN DESIGN */}
                <div className="relative max-w-5xl">
                  {/* CRITICAL FIX 4: Chat Input - 150px Height */}
                  <div className="chat-input-container relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={getPlaceholder()}
                      className="chat-textarea w-full px-6 py-6 pr-36 bg-slate-800/60 border border-blue-500/30 
                                rounded-2xl backdrop-blur text-white placeholder-gray-400 text-lg
                                focus:outline-none focus:border-blue-500 focus:bg-slate-800/80"
                      disabled={isStreaming || !sessionId}
                    />
                    
                    {/* INPUT ACTIONS */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                      <button 
                        className="p-3 hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Attach file"
                      >
                        <Paperclip className="w-6 h-6 text-gray-400" />
                      </button>
                      <button 
                        onClick={sendMessage}
                        disabled={!input.trim() || isStreaming || !sessionId}
                        className="p-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send message"
                      >
                        <Send className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Chat History Status */}
                  {showChatHistoryMessage && (
                    <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                        <span className="font-medium">💾 Chat History Enabled</span>
                      </div>
                      <p className="text-emerald-300 text-sm">
                        Your conversations with Ailock are being saved and will persist across sessions.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map(message => (
              <React.Fragment key={message.id}>
                <MessageBubble 
                  message={message} 
                  isStreaming={streamingMessageId === message.id}
                />
                {message.role === 'assistant' && message.intents && message.intents.length > 0 && (
                  <div className="mb-6 ml-12">
                    <div className="grid gap-4">
                      {message.intents.map((intent: IntentCard) => (
                        <div 
                          key={intent.id}
                          onClick={() => handleIntentCardClick(intent)}
                          className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/30 rounded-xl p-4 cursor-pointer hover:from-blue-500/20 hover:to-indigo-600/20 transition-all shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-white font-medium text-sm flex-1">
                              {intent.title}
                            </h4>
                            <div className="flex items-center space-x-2 ml-2">
                              {intent.matchScore && (
                                <div className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg border border-blue-500/30">
                                  <span className="text-xs font-medium">{intent.matchScore}% match</span>
                                </div>
                              )}
                              {intent.priority === 'urgent' && (
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-xs ${getPriorityColor(intent.priority)}`}>
                                  <span className="font-medium">Urgent</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-white/60 text-xs leading-relaxed mb-3">
                            {intent.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {intent.requiredSkills.slice(0, 3).map((skill) => (
                              <span 
                                key={skill}
                                className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md text-xs font-medium border border-purple-500/30"
                              >
                                {skill}
                              </span>
                            ))}
                            {intent.requiredSkills.length > 3 && (
                              <span className="text-white/40 text-xs px-2 py-1">
                                +{intent.requiredSkills.length - 3} more
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            {intent.distance && (
                              <div className="flex items-center space-x-2 text-white/50">
                                <MapPin className="w-3 h-3" />
                                <span>{intent.distance}</span>
                              </div>
                            )}
                            {intent.budget && (
                              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">
                                {intent.budget}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            
            {/* Intent Preview */}
            {showIntentPreview && intentPreview && (
              <IntentPreview
                title={intentPreview.title}
                description={intentPreview.description}
                category={intentPreview.category}
                requiredSkills={intentPreview.requiredSkills}
                location={location}
                budget={intentPreview.budget}
                timeline={intentPreview.timeline}
                priority={intentPreview.priority}
                onConfirm={handleCreateIntent}
                onCancel={handleCancelIntent}
                isLoading={isCreatingIntent}
              />
            )}
            
            {isStreaming && !streamingMessageId && (
              <div className="flex items-center space-x-3 text-white/60 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={bottomOfMessagesRef} />
          </div>
        )}
      </div>

      {/* Input Area - отображается только после первого сообщения */}
      {messages.length > 0 && (
        <div className="px-6 pb-4 pt-2 bg-gradient-to-t from-slate-800/90 via-slate-800/90 to-transparent">
          <div className="relative max-w-5xl mx-auto">
            <div className="chat-input-container relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className="chat-textarea w-full px-6 py-6 pr-36 bg-slate-800/60 border border-blue-500/30 
                          rounded-2xl backdrop-blur text-white placeholder-gray-400 text-lg
                          focus:outline-none focus:border-blue-500 focus:bg-slate-800/80 resize-none transition-all duration-300"
                disabled={isStreaming || !sessionId}
              />

              {/* INPUT ACTIONS */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <button 
                  className="p-3 hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-6 h-6 text-gray-400" />
                </button>
                <button 
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming || !sessionId}
                  className="p-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <Send className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {levelUpInfo && (
        <LevelUpModal
          isOpen={!!levelUpInfo}
          onClose={() => setLevelUpInfo(null)}
          newLevel={levelUpInfo.newLevel}
          skillPointsGained={levelUpInfo.skillPointsGained}
          xpGained={levelUpInfo.xpGained}
        />
      )}
      
      {/* Voice Agent Widget - Client Only */}
      <VoiceAgentClientWrapper />
    </div>
  );
}