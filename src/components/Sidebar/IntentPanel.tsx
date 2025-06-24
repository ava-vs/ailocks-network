import { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Zap, Star, Calendar, Filter, Database, AlertCircle, Crown, Bot, Search, Plus, Target, ChevronUp, ChevronDown, Bell } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { appState } from '../../lib/store';
import { useUserSession } from '../../hooks/useUserSession';
import { cn } from '../../lib/utils';
import AilockWidget from '../Ailock/AilockWidget';
import { ailockApi } from '../../lib/ailock/api';
import type { FullAilockProfile } from '../../lib/ailock/core';

interface Intent {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  distance: string;
  requiredSkills: string[];
  budget?: string;
  timeline?: string;
  priority: string;
  matchScore: number;
  createdAt: string;
  userName?: string;
  isOwn?: boolean;
}

interface IntentPanelProps {
  isExpanded?: boolean;
}

export default function IntentPanel({ isExpanded = false }: IntentPanelProps) {
  const { language, userLocation: location } = useStore(appState);
  const { currentUser } = useUserSession();
  
  const [myIntents, setMyIntents] = useState<Intent[]>([]);
  const [otherIntents, setOtherIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dataSource, setDataSource] = useState<'real' | 'mock' | 'error'>('mock');
  const [intentsExpanded, setIntentsExpanded] = useState(true);
  const [newNotifications, setNewNotifications] = useState(1); // "Just Added" карточка считается как новое уведомление
  const [ailockProfile, setAilockProfile] = useState<FullAilockProfile | null>(null);

  // Listen for new intents created from chat
  useEffect(() => {
    const handleIntentCreated = (event: CustomEvent) => {
      const newIntent = event.detail;
      
      // Check if this intent belongs to the current user
      if (newIntent.userId === currentUser.id) {
        const intentWithMetadata = {
          ...newIntent,
          distance: '< 1 mile',
          matchScore: 100,
          createdAt: 'Just now',
          userName: currentUser.name,
          isOwn: true,
          budget: newIntent.budget ? `$${Math.floor(newIntent.budget / 1000)}k` : null
        };
        
        setMyIntents(prev => [intentWithMetadata, ...prev]);
        // Add notification for new intent
        setNewNotifications(prev => prev + 1);
      }
    };

    window.addEventListener('intentCreated', handleIntentCreated as EventListener);
    return () => window.removeEventListener('intentCreated', handleIntentCreated as EventListener);
  }, [currentUser.id, currentUser.name]);

  // Listen for user changes to refresh data
  useEffect(() => {
    const handleUserChanged = () => {
      fetchIntents();
    };

    window.addEventListener('userChanged', handleUserChanged);
    return () => window.removeEventListener('userChanged', handleUserChanged);
  }, []);

  // Reactive effect - refetch when location, filter, or user changes
  useEffect(() => {
    fetchIntents();
  }, [location, filter, currentUser.id]);

  // Load Ailock profile
  useEffect(() => {
    if (currentUser.id && currentUser.id !== 'loading') {
      loadAilockProfile();
    }
  }, [currentUser.id]);

  const loadAilockProfile = async () => {
    try {
      const profile = await ailockApi.getProfile(currentUser.id);
      setAilockProfile(profile);
    } catch (error) {
      console.error('Failed to load Ailock profile:', error);
    }
  };

  const fetchIntents = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        userCountry: location.country,
        userCity: location.city,
        category: filter,
        limit: '12'
      });
      
      // Only add userId if it's valid (not loading)
      if (currentUser.id && currentUser.id !== 'loading') {
        params.append('userId', currentUser.id);
      }

      console.log('🔄 Fetching intents with params:', params.toString());
      
      const response = await fetch(`/.netlify/functions/intents-list?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real data received:', data);
        
        if (data.intents && data.intents.length > 0) {
          // Separate intents into "mine" and "others"
          const myIntentsArray: Intent[] = [];
          const otherIntentsArray: Intent[] = [];
          
          data.intents.forEach((intent: any) => {
            const processedIntent = {
              ...intent,
              distance: calculateDistance(location, intent),
              matchScore: intent.matchScore || Math.floor(Math.random() * 30) + 70,
              createdAt: intent.createdAt || 'Unknown',
              userName: intent.userName || 'Anonymous',
              budget: intent.budget ? `$${Math.floor(intent.budget / 1000)}k` : null
            };
            
            if (intent.isOwn) {
              myIntentsArray.push(processedIntent);
            } else {
              otherIntentsArray.push(processedIntent);
            }
          });
          
          setMyIntents(myIntentsArray);
          setOtherIntents(otherIntentsArray);
          setDataSource('real');
          setLoading(false);
          return;
        }
      } else {
        console.warn('⚠️ API response not ok:', response.status, response.statusText);
      }
      
      // Fallback to mock data if real data fails or is empty
      console.log('📝 Using mock data as fallback');
      const mockData = getMockIntents(location);
      
      // Separate mock data (for demo, assign some to current user)
      const myMockIntents: Intent[] = [];
      const otherMockIntents: Intent[] = [];
      
      mockData.forEach((intent, index) => {
        // For demo: assign every 3rd intent to current user
        if (index % 3 === 0) {
          myMockIntents.push({ ...intent, isOwn: true, userName: currentUser.name });
        } else {
          otherMockIntents.push({ ...intent, isOwn: false });
        }
      });
      
      setMyIntents(myMockIntents);
      setOtherIntents(otherMockIntents);
      setDataSource('mock');
      
    } catch (err) {
      console.warn('⚠️ Error fetching real data, using mock data:', err);
      const mockData = getMockIntents(location);
      setMyIntents([]);
      setOtherIntents(mockData);
      setDataSource('error');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (userLocation: any, intent: any) => {
    if (userLocation.city === intent.targetCity && userLocation.country === intent.targetCountry) {
      // Use deterministic distance based on intent ID to avoid hydration mismatch
      const hash = intent.id ? intent.id.charCodeAt(intent.id.length - 1) : 0;
      const miles = (hash % 5) + 1;
      const decimal = (hash % 9);
      return `${miles}.${decimal} miles`;
    }
    if (userLocation.country === intent.targetCountry) {
      const hash = intent.id ? intent.id.charCodeAt(intent.id.length - 1) : 0;
      const miles = (hash % 50) + 10;
      const decimal = (hash % 9);
      return `${miles}.${decimal} miles`;
    }
    if (!intent.targetCountry) {
      return 'Remote';
    }
    const hash = intent.id ? intent.id.charCodeAt(intent.id.length - 1) : 0;
    const miles = (hash % 500) + 100;
    const decimal = (hash % 9);
    return `${miles}.${decimal} miles`;
  };

  const getMockIntents = (currentLocation: any): Intent[] => {
    const baseIntents = [
      {
        id: 'mock-1',
        title: 'AI Startup Collaboration',
        description: `Looking for AI developers to build next-gen chatbot platform with advanced NLP capabilities in ${currentLocation.city}`,
        category: 'Technology',
        requiredSkills: ['React', 'Python', 'Machine Learning', 'NLP'],
        budget: '$50k-100k',
        timeline: '3-6 months',
        priority: 'urgent',
        matchScore: 95,
        createdAt: '2 hours ago',
        userName: 'John Smith',
        isOwn: false
      },
      {
        id: 'mock-2', 
        title: 'Market Research Project',
        description: `Need experienced researcher for consumer behavior analysis in tech sector - ${currentLocation.country} market focus`,
        category: 'Research',
        requiredSkills: ['Analytics', 'Statistics', 'Survey Design'],
        budget: '$15k-25k',
        timeline: '2-3 months',
        priority: 'medium',
        matchScore: 87,
        createdAt: '5 hours ago',
        userName: 'Anna Petrov',
        isOwn: false
      },
      {
        id: 'mock-3',
        title: 'Creative Design Partnership',
        description: `Seeking UX/UI designer for innovative mobile app project in fintech space - ${currentLocation.city} based preferred`,
        category: 'Design',
        requiredSkills: ['Figma', 'UX Research', 'Mobile Design'],
        budget: '$30k-50k',
        timeline: '4-5 months',
        priority: 'medium',
        matchScore: 78,
        createdAt: '1 day ago',
        userName: 'Maria Garcia',
        isOwn: false
      },
      {
        id: 'mock-4',
        title: 'Data Science Consulting',
        description: `Healthcare startup needs data scientist for predictive analytics implementation in ${currentLocation.country}`,
        category: 'Analytics',
        requiredSkills: ['Python', 'TensorFlow', 'Healthcare Data'],
        budget: '$40k-70k',
        timeline: '6-8 months',
        priority: 'low',
        matchScore: 72,
        createdAt: '2 days ago',
        userName: 'David Chen',
        isOwn: false
      },
      {
        id: 'mock-5',
        title: 'Blockchain Development',
        description: 'DeFi protocol seeking smart contract developers for new lending platform',
        category: 'Blockchain',
        requiredSkills: ['Solidity', 'Web3', 'DeFi'],
        budget: '$80k-120k',
        timeline: '8-12 months',
        priority: 'medium',
        matchScore: 68,
        createdAt: '3 days ago',
        userName: 'Sarah Johnson',
        isOwn: false
      }
    ];

    // Add deterministic location-aware distances to avoid hydration mismatch
    return baseIntents.map((intent, index) => {
      let distance;
      if (currentLocation.isDefault) {
        // Use fixed distances for default location
        distance = ['2.3 miles', '5.7 miles', '8.1 miles', '12.4 miles', '15.2 miles'][index];
      } else {
        // Use deterministic distance based on intent ID
        const hash = intent.id.charCodeAt(intent.id.length - 1);
        const miles = (hash % 20) + 1;
        const decimal = (hash % 9);
        distance = `${miles}.${decimal} miles`;
      }
      
      return {
        ...intent,
        distance
      };
    });
  };

  const getTexts = () => {
    const texts = {
      en: {
        title: 'Intent Panel',
        dataSource: 'Data Source',
        location: 'Your Location',
        activeMatching: 'Active Matching',
        nearbyOpportunities: 'Nearby Opportunities',
        myIntents: 'My Intents',
        filter: 'Filter',
        all: 'All',
        technology: 'Technology',
        research: 'Research',
        design: 'Design',
        analytics: 'Analytics',
        blockchain: 'Blockchain',
        marketing: 'Marketing',
        security: 'Security',
        createIntent: 'Create Intent',
        loading: 'Loading...',
        noIntents: 'No intents found.',
        urgent: 'Urgent',
        realData: 'Live Database',
        mockData: 'Demo Data',
        errorData: 'Offline Mode',
        createdByYou: 'Created by you',
        myAilock: 'My Ailock',
        matchScore: 'Match Score',
        real: 'Live Database',
        mock: 'Demo Data',
        error: 'Offline Mode',
      },
      ru: {
        title: 'Панель интентов',
        dataSource: 'Источник данных',
        location: 'Ваше местоположение',
        activeMatching: 'Активный подбор',
        nearbyOpportunities: 'Возможности поблизости',
        myIntents: 'Мои интенты',
        filter: 'Фильтр',
        all: 'Все',
        technology: 'Технологии',
        research: 'Исследования',
        design: 'Дизайн',
        analytics: 'Аналитика',
        blockchain: 'Блокчейн',
        marketing: 'Маркетинг',
        security: 'Безопасность',
        createIntent: 'Создать интент',
        loading: 'Загрузка...',
        noIntents: 'Нет доступных интентов.',
        urgent: 'Срочно',
        realData: 'Live Database',
        mockData: 'Demo Data',
        errorData: 'Offline Mode',
        createdByYou: 'Создано вами',
        myAilock: 'Мой Ailock',
        real: 'Live Database',
        mock: 'Demo Data',
        error: 'Offline Mode',
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
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

  const getDataSourceColor = () => {
    switch (dataSource) {
      case 'real': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'mock': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'error': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getAvatarGradient = () => {
    if (!ailockProfile) return 'from-cyan-400 via-blue-400 to-indigo-400';
    if (ailockProfile.level >= 15) return 'from-purple-400 via-pink-400 to-yellow-400';
    if (ailockProfile.level >= 10) return 'from-blue-400 via-purple-400 to-pink-400';
    if (ailockProfile.level >= 5) return 'from-green-400 via-blue-400 to-purple-400';
    return 'from-cyan-400 via-blue-400 to-indigo-400';
  };

  const texts = getTexts();
  const filteredOtherIntents = filter === 'all' ? otherIntents : otherIntents.filter(intent => 
    intent.category.toLowerCase() === filter.toLowerCase()
  );

  return (
    <div className={cn("flex flex-col h-full text-white p-2", !isExpanded && "items-center")}>
      {!isExpanded && (
        <div className="flex flex-col items-center space-y-4 p-2">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer relative"
            onClick={() => {
              // Clear all notifications when avatar is clicked
              setNewNotifications(0);
            }}
            title={newNotifications > 0 ? `${newNotifications} new notification${newNotifications !== 1 ? 's' : ''}` : 'No new notifications'}
          >
            {/* Ailock Avatar with dynamic gradient border */}
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarGradient()} p-0.5 relative`}>
              <div className="w-full h-full rounded-lg bg-slate-800/90 flex items-center justify-center">
                <img 
                  src="/images/ailock-avatar.png"
                  alt="Ailock Avatar" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              {/* Level badge */}
              {ailockProfile && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-slate-800">
                  {ailockProfile.level}
                </div>
              )}
            </div>
            {/* Notification Badge */}
            {newNotifications > 0 && (
              <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border border-slate-800">
                <span className="text-xs font-medium text-white">{newNotifications}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="p-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">In Work</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNewNotifications(0)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={newNotifications > 0 ? `Mark ${newNotifications} notification${newNotifications !== 1 ? 's' : ''} as read` : 'No new notifications'}
              >
                <Bell className={`w-4 h-4 ${newNotifications > 0 ? 'text-blue-400' : 'text-white/60'}`} />
              </button>
              {newNotifications > 0 && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Ailock Widget */}
          <div className="mb-4">
            <AilockWidget />
          </div>

          {/* Work Items */}
          <div className="space-y-3">
            <div 
              className="glass-morphism rounded-xl p-4 hover-glow cursor-pointer transition-all"
              onClick={() => {
                // Mark as read when clicked
                if (newNotifications > 0) {
                  setNewNotifications(prev => Math.max(0, prev - 1));
                }
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm text-white">Design Collaboration</h4>
                <div className="flex items-center gap-1">
                  {newNotifications > 0 ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-400 font-medium">Just Added</span>
                    </div>
                  ) : (
                    <span className="text-xs text-white/60">Read</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-white/60">Rating:</span>
                <span className="text-xs text-yellow-400">4.8/5</span>
              </div>
              <p className="text-xs text-white/60 mb-3">
                UI/UX design project for modern web app. Looking for creative collaboration with experienced designers.
              </p>
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium hover:bg-yellow-500/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle notify action
                  }}
                >
                  🔔 Notify
                </button>
                <button 
                  className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium hover:bg-green-500/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle active action
                  }}
                >
                  ✅ Active
                </button>
              </div>
            </div>
          </div>

          {/* Intents Section */}
          <div className="glass-morphism rounded-xl p-4">
            <button 
              onClick={() => setIntentsExpanded(!intentsExpanded)}
              className="flex items-center justify-between w-full mb-3"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-sm text-white">Intents</span>
                <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {myIntents.length + filteredOtherIntents.length}
                </div>
              </div>
              {intentsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {intentsExpanded && (
              <div className="space-y-2">
                <div className="flex gap-2 mb-3">
                  <button 
                    onClick={() => setFilter('all')}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filter === 'all' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'hover:bg-white/10 text-white/60'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilter('design')}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filter === 'design' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'hover:bg-white/10 text-white/60'
                    }`}
                  >
                    Design
                  </button>
                  <button 
                    onClick={() => setFilter('technology')}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filter === 'technology' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'hover:bg-white/10 text-white/60'
                    }`}
                  >
                    Tech
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {myIntents.map(intent => (
                      <div key={intent.id} className="p-2 glass-morphism rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white">{intent.title}</span>
                          <span className="text-xs text-green-400">{intent.matchScore}%</span>
                        </div>
                        <p className="text-xs text-white/60">My opportunity</p>
                      </div>
                    ))}
                    
                    {filteredOtherIntents.slice(0, 3).map(intent => (
                      <div key={intent.id} className="p-2 glass-morphism rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white">{intent.title}</span>
                          <span className="text-xs text-green-400">{intent.matchScore}%</span>
                        </div>
                        <p className="text-xs text-white/60">{intent.distance}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const IntentCard = ({ intent, texts, getPriorityColor }: { intent: Intent, texts: any, getPriorityColor: (p:string) => string }) => (
  <div className="glass-morphism rounded-xl p-4 hover-glow cursor-pointer transition-all">
    <div className="flex items-start justify-between mb-2">
      <h4 className="font-medium text-sm text-white flex-1 pr-2">{intent.title}</h4>
      <div className="flex items-center gap-1">
        <span className="text-xs text-blue-400">
          {intent.matchScore}% match
        </span>
      </div>
    </div>
    
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs text-white/60">Rating:</span>
      <span className="text-xs text-yellow-400">
        {Math.round((intent.matchScore / 100) * 5 * 10) / 10}/5
      </span>
    </div>
    
    <p className="text-xs text-white/60 mb-3 line-clamp-2">
      {intent.description}
    </p>
    
    <div className="flex gap-2">
      <button className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium hover:bg-yellow-500/30 transition-colors">
        🔔 Notify
      </button>
      {intent.isOwn ? (
        <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium hover:bg-blue-500/30 transition-colors">
          ✏️ Edit
        </button>
      ) : (
        <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium hover:bg-green-500/30 transition-colors">
          ✅ Connect
        </button>
      )}
    </div>
    
    <div className="flex items-center justify-between text-xs text-white/40 mt-2 pt-2 border-t border-white/10">
      <div className="flex items-center space-x-1">
        <MapPin size={12} />
        <span>{intent.distance}</span>
      </div>
      <span>{intent.createdAt}</span>
    </div>
  </div>
);