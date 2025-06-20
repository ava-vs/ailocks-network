import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Bot, AlertCircle, Wifi, WifiOff, Eye, MessageCircle, Copy, Plus, MapPin, TrendingUp, Users, CheckCircle, XCircle, Loader, ArrowRight, BrainCircuit, Search, DraftingCompass } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentMode, currentLanguage, userLocation } from '../../lib/store';
import { useUserSession } from '../../hooks/useUserSession';
import MessageBubble from './MessageBubble';
import ContextActions from './ContextActions';
import IntentPreview from './IntentPreview';
import { getProfile, gainXp } from '../../lib/ailock/api';
import type { FullAilockProfile } from '../../lib/ailock/core';
import LevelUpModal from '../Ailock/LevelUpModal';
import toast, { Toaster } from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  mode: string;
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
  const mode = useStore(currentMode);
  const language = useStore(currentLanguage);
  const location = useStore(userLocation);
  const { currentUser, demoUsers } = useUserSession();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
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
  const [foundIntents, setFoundIntents] = useState<IntentCard[]>([]);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
  const [demoUsersSeeded, setDemoUsersSeeded] = useState(false);
  const [ailockProfile, setAilockProfile] = useState<FullAilockProfile | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number, skillPointsGained: number, xpGained: number } | null>(null);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showIntentPreview, foundIntents]);

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
            userId: currentUser.id // Pass user ID for database persistence
          })
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          setConnectionStatus('connected');
          
          // Check if it's a fallback session
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
        // Create a local fallback session
        const mockSessionId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setSessionId(mockSessionId);
        setConnectionStatus('connected'); // Still allow chat to work
        setError('Session created in offline mode - messages will not be saved');
      }
    };

    initSession();
  }, [mode, language, currentUser.id, demoUsersSeeded]);

  // Load chat history when session is created
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!sessionId || sessionId.startsWith('local-') || sessionId.startsWith('fallback-')) {
        setChatHistoryLoaded(true);
        return; // Skip loading for fallback sessions
      }

      try {
        console.log('📥 Loading chat history for session:', sessionId);
        const response = await fetch(`/.netlify/functions/chat-history?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            const loadedMessages = data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(loadedMessages);
            console.log('✅ Chat history loaded:', loadedMessages.length, 'messages');
          } else {
            console.log('📭 No chat history found for session');
          }
        } else {
          console.warn('⚠️ Failed to load chat history:', response.status);
        }
      } catch (error) {
        console.warn('Failed to load chat history:', error);
      } finally {
        setChatHistoryLoaded(true);
      }
    };

    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId]);

  useEffect(() => {
    // Load persisted user session
    if (currentUser && currentUser.id !== 'loading') {
      console.log('Current user is valid, fetching profile:', currentUser.name);
      getProfile(currentUser.id)
        .then(setAilockProfile)
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
    setFoundIntents([]); // Clear previous intents

    try {
      // Send to Ailock for processing with user ID
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
          userId: currentUser.id === 'loading' ? undefined : currentUser.id, // Only include valid user ID
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
                setAilockStatus('available'); // Mark as working
                setError(null);
                console.log('✅ Message conversation saved to database');
                handleXpGain();
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
                    setAilockStatus('available'); // Mark as working
                    setError(null);
                    console.log('✅ Message conversation saved to database');
                    handleXpGain();
                    resolve();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.type === 'chunk') {
                      assistantMessage.content += parsed.content;
                      setMessages(prev => prev.map(msg => 
                        msg.id === assistantMessage.id ? { ...assistantMessage } : msg
                      ));
                    } else if (parsed.type === 'complete') {
                      assistantMessage.content = parsed.fullResponse;
                      setMessages(prev => prev.map(msg => 
                        msg.id === assistantMessage.id ? { ...assistantMessage } : msg
                      ));
                    } else if (parsed.type === 'intents') {
                      // Display found intents as cards
                      setFoundIntents(parsed.intents);
                    } else if (parsed.type === 'actions') {
                      setSuggestedActions(parsed.actions);
                    } else if (parsed.type === 'error') {
                      setError(parsed.error);
                      if (parsed.fallback) {
                        assistantMessage.content = parsed.fallback;
                        setMessages(prev => prev.map(msg => 
                          msg.id === assistantMessage.id ? { ...assistantMessage } : msg
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
    
    // Simulate typing with fallback response
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleContextAction = async (actionId: string) => {
    // Handle Ailock-specific actions
    const actionMessages: Record<string, string> = {
      'create-intent-from-request': 'Create a new collaboration opportunity based on my request',
      'search-broader-area': 'Search for opportunities in a broader geographic area',
      'get-market-insights': 'Provide market insights and trends for my field',
      'find-experts': 'Help me find experts in my area of interest',
      'view-intent-details': 'Show me more details about these opportunities',
      'contact-intent-owner': 'Help me contact the opportunity owners',
      'create-similar-intent': 'Help me create a similar opportunity',
      'search-nearby': `Search for nearby opportunities and insights in ${location.city}, ${location.country}`,
      'analyze-trends': 'Analyze current market trends and emerging patterns in my industry',
      'find-sources': 'Help me find reliable sources and research data for my project',
      'brainstorm': 'Let\'s brainstorm creative ideas for my current challenge',
      'find-collaborators': 'Help me find potential collaborators in my area',
      'market-research': 'Conduct market research for my target audience',
      'deep-analysis': 'Perform a deep strategic analysis of my situation',
      'competitive-intel': 'Gather competitive intelligence in my market',
      'risk-assessment': 'Conduct a comprehensive risk assessment'
    };

    const message = actionMessages[actionId];
    if (message) {
      setInput(message);
      inputRef.current?.focus();
    }
  };

  const handleCreateIntent = async () => {
    if (!sessionId || !intentPreview) return;
    
    // Ensure we have a valid user ID before creating intent
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
          userId: currentUser.id // Pass current user ID
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add success message to chat
        const successMessage: Message = {
          id: `${Date.now()}-system`,
          content: `✅ Intent created successfully: "${data.intent.title}". Your collaboration opportunity is now live and visible to potential partners!`,
          role: 'assistant',
          timestamp: new Date(),
          mode
        };

        setMessages(prev => [...prev, successMessage]);
        
        // Trigger sidebar refresh with user ID
        window.dispatchEvent(new CustomEvent('intentCreated', { 
          detail: { 
            ...data.intent, 
            userId: currentUser.id,
            userName: currentUser.name,
            isOwn: true
          } 
        }));
        
        // Remove the create-intent action since it's been completed
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
    // Handle clicking on intent cards - could open details, contact, etc.
    console.log('Intent card clicked:', intent);
    // For now, just add a message about the intent
    const message = `Tell me more about "${intent.title}" - this looks interesting!`;
    setInput(message);
    inputRef.current?.focus();
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
        help: "I help you find collaboration opportunities, analyze markets, and connect with the right people. Ask me anything!"
      },
      ru: {
        welcome: "Привет! Я Айлок, ваш персональный ИИ-помощник.",
        help: "Я помогаю находить возможности для сотрудничества, анализировать рынки и связываться с нужными людьми. Спрашивайте что угодно!"
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

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'connecting': return <Wifi className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'disconnected': return <WifiOff className="w-4 h-4 text-red-400" />;
    }
  };

  const getAilockStatusText = () => {
    switch (ailockStatus) {
      case 'available': return 'Ailock Connected';
      case 'unavailable': return 'Ailock Offline';
      case 'unknown': return 'Checking Ailock...';
    }
  };

  const getAilockStatusColor = () => {
    switch (ailockStatus) {
      case 'available': return 'text-emerald-400';
      case 'unavailable': return 'text-red-400';
      case 'unknown': return 'text-yellow-400';
    }
  };

  const getSessionStatusText = () => {
    if (connectionStatus === 'connected' && ailockStatus === 'available') {
      return 'Live Mode';
    } else if (connectionStatus === 'connected' && ailockStatus === 'unavailable') {
      return 'Offline Mode';
    } else if (connectionStatus === 'connecting') {
      return 'Connecting...';
    } else {
      return 'Offline Mode';
    }
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

  const handleXpGain = async () => {
    if (!ailockProfile) return;

    try {
        const result = await gainXp(ailockProfile.id, 'chat_message_sent');
        if (result.success) {
            toast.success(`+${result.xpGained} XP`, { duration: 1500, icon: '✨' });
            
            // Optimistically update profile in state
            setAilockProfile(prev => prev ? {...prev, xp: result.newXp} : null);

            if (result.leveledUp) {
                setLevelUpInfo({
                    newLevel: result.newLevel,
                    skillPointsGained: result.skillPointsGained,
                    xpGained: result.xpGained
                });
                // Optimistically update level and skill points
                setAilockProfile(prev => prev ? {...prev, level: result.newLevel, skillPoints: (prev.skillPoints || 0) + result.skillPointsGained} : null);
            }
        }
    } catch (error) {
        console.error("Failed to gain XP", error);
        toast.error("Failed to record XP gain");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl">
      {/* Connection Status Bar */}
      <div className="flex-shrink-0 px-6 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getConnectionStatusIcon()}
            <span className="text-xs text-white/70">
              {getSessionStatusText()}
            </span>
            <span className="text-xs text-white/50">•</span>
            <span className={`text-xs ${getAilockStatusColor()}`}>
              {getAilockStatusText()}
            </span>
            <span className="text-xs text-white/50">•</span>
            <span className="text-xs text-white/60">
              User: {currentUser.name}
            </span>
            {isPersistentSession && (
              <>
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs text-emerald-400">
                  💾 History Saved
                </span>
              </>
            )}
          </div>
          {error && (
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        {messages.length === 0 && chatHistoryLoaded ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center max-w-2xl">
              {/* AI Character Image */}
              <div className="w-32 h-32 mx-auto mb-8 relative">
                <img 
                  src="/api/placeholder/120/120" 
                  alt="Ailock AI Assistant"
                  className="w-full h-full object-contain filter drop-shadow-2xl"
                  style={{
                    filter: 'drop-shadow(0 20px 40px rgba(79, 70, 229, 0.3))'
                  }}
                />
              </div>
              
              {/* Welcome Message */}
              <h2 className="text-white text-3xl font-semibold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {getWelcomeText().welcome}
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-2">
                I'm here to help you in <span className="text-blue-400 font-medium">{mode}</span> mode.
              </p>
              <p className="text-white/60 text-base leading-relaxed">
                {getModeDescription(mode)}
              </p>
              <p className="text-white/60 text-base leading-relaxed mt-6">
                {getWelcomeText().help}
              </p>
              
              {/* Chat History Status */}
              {isPersistentSession && (
                <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                    <span className="font-medium">💾 Chat History Enabled</span>
                  </div>
                  <p className="text-emerald-300 text-sm">
                    Your conversations with Ailock are being saved and will persist across sessions.
                  </p>
                </div>
              )}
              
              {/* Ailock Status Warning */}
              {ailockStatus === 'unavailable' && (
                <div className="mt-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center space-x-2 text-amber-400 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Ailock Services Configuration Required</span>
                  </div>
                  <p className="text-amber-300 text-sm">
                    Please configure AI API keys in Netlify environment variables for full functionality.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : !chatHistoryLoaded ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-white/60 text-sm">Loading chat history...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map(message => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isStreaming={streamingMessageId === message.id}
              />
            ))}
            
            {/* Intent Cards Display */}
            {foundIntents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <span>Found Opportunities</span>
                </h3>
                <div className="grid gap-4">
                  {foundIntents.map((intent) => (
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
                          <div className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg border border-blue-500/30">
                            <span className="text-xs font-medium">{intent.matchScore}% match</span>
                          </div>
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
                        <div className="flex items-center space-x-2 text-white/50">
                          <MapPin className="w-3 h-3" />
                          <span>{intent.distance}</span>
                        </div>
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-white/60 mb-3">Suggested actions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleContextAction(action.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all border text-sm font-medium ${
                    action.priority === 'high'
                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  }`}
                >
                  {getActionIcon(action.icon)}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Context Actions - Compact Design */}
      <div className="flex-shrink-0 px-6 py-4">
        <ContextActions 
          mode={mode} 
          language={language} 
          onAction={handleContextAction}
          lastMessage={lastUserMessage}
        />
      </div>

      {/* Input Area - Modern AI Style */}
      <div className="flex-shrink-0 px-6 py-6 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm">
        <div className="flex items-end space-x-4 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              rows={3}
              className="w-full bg-white/5 backdrop-blur-sm text-white rounded-2xl px-6 py-4 pr-32 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all resize-none border border-white/10 shadow-2xl placeholder-white/40"
              disabled={isStreaming || !sessionId}
            />
            
            {/* Input Controls */}
            <div className="absolute right-4 bottom-4 flex items-center space-x-2">
              <button 
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => setIsListening(!isListening)}
                className={`p-2 rounded-lg transition-all ${
                  isListening 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
              
              <button 
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming || !sessionId}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          className: '',
          style: {
            border: '1px solid #7132f5',
            padding: '16px',
            color: '#e5e7eb',
            background: '#1f2937'
          },
        }}
      />
      {levelUpInfo && (
        <LevelUpModal
          isOpen={!!levelUpInfo}
          onClose={() => setLevelUpInfo(null)}
          newLevel={levelUpInfo.newLevel}
          skillPointsGained={levelUpInfo.skillPointsGained}
          xpGained={levelUpInfo.xpGained}
        />
      )}
    </div>
  );
}