import { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Zap, Star, Calendar, Filter, Database, AlertCircle, Crown } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentLanguage, userLocation } from '../../lib/store';
import { useUserSession } from '../../hooks/useUserSession';

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

export default function IntentPanel() {
  const language = useStore(currentLanguage);
  const location = useStore(userLocation);
  const { currentUser } = useUserSession();
  
  const [myIntents, setMyIntents] = useState<Intent[]>([]);
  const [otherIntents, setOtherIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dataSource, setDataSource] = useState<'real' | 'mock' | 'error'>('mock');

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
        location: 'Your Location',
        activeMatching: 'Active Matching',
        nearbyOpportunities: 'Nearby Opportunities',
        myIntents: 'My Intents',
        createIntent: 'Create New Intent',
        urgent: 'Urgent',
        loading: 'Loading opportunities...',
        noIntents: 'No opportunities found in your area.',
        noMyIntents: 'No intents created yet. Start a conversation and create your first intent!',
        matchScore: 'Match',
        all: 'All',
        technology: 'Technology',
        research: 'Research',
        design: 'Design',
        analytics: 'Analytics',
        blockchain: 'Blockchain',
        marketing: 'Marketing',
        security: 'Security',
        locationUpdated: 'Location updated - refreshing opportunities...',
        dataSource: 'Data Source',
        realData: 'Live Database',
        mockData: 'Demo Data',
        errorData: 'Offline Mode',
        createdByYou: 'Created by you'
      },
      ru: {
        location: 'Ваше местоположение',
        activeMatching: 'Активный поиск',
        nearbyOpportunities: 'Возможности рядом',
        myIntents: 'Мои интенты',
        createIntent: 'Создать новый интент',
        urgent: 'Срочно',
        loading: 'Загрузка возможностей...',
        noIntents: 'В вашем районе не найдено возможностей.',
        noMyIntents: 'Интенты еще не созданы. Начните разговор и создайте свой первый интент!',
        matchScore: 'Совпадение',
        all: 'Все',
        technology: 'Технологии',
        research: 'Исследования',
        design: 'Дизайн',
        analytics: 'Аналитика',
        blockchain: 'Блокчейн',
        marketing: 'Маркетинг',
        security: 'Безопасность',
        locationUpdated: 'Местоположение обновлено - обновляем возможности...',
        dataSource: 'Источник данных',
        realData: 'Живая база данных',
        mockData: 'Демо данные',
        errorData: 'Офлайн режим',
        createdByYou: 'Создано вами'
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

  const texts = getTexts();
  const filteredOtherIntents = filter === 'all' ? otherIntents : otherIntents.filter(intent => 
    intent.category.toLowerCase() === filter.toLowerCase()
  );

  return (
    <div className="w-80 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-l border-white/10 flex flex-col h-full flex-shrink-0">
      {/* Location Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center space-x-3 text-white mb-3">
          <MapPin className="w-5 h-5 text-blue-400" />
          <span className="font-medium">{texts.location}</span>
        </div>
        <p className="text-white/70 text-sm mb-4">
          {location.city}, {location.country}
          {location.isDefault && (
            <span className="block text-xs text-white/50 mt-1">
              (Default location)
            </span>
          )}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-emerald-400 font-medium">{texts.activeMatching}</span>
          </div>
          
          {/* Data Source Indicator */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-xs ${getDataSourceColor()}`}>
            {dataSource === 'real' && <Database className="w-3 h-3" />}
            {dataSource === 'mock' && <Star className="w-3 h-3" />}
            {dataSource === 'error' && <AlertCircle className="w-3 h-3" />}
            <span className="font-medium">
              {dataSource === 'real' && texts.realData}
              {dataSource === 'mock' && texts.mockData}
              {dataSource === 'error' && texts.errorData}
            </span>
          </div>
        </div>
      </div>

      {/* My Intents Section */}
      {myIntents.length > 0 && (
        <div className="flex-shrink-0 p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-indigo-600/10">
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">{texts.myIntents}</h3>
            <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
              {myIntents.length}
            </span>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {myIntents.map((intent) => (
              <div key={intent.id} className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-4 shadow-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium text-sm line-clamp-2 flex-1">
                    {intent.title}
                  </h4>
                  <div className="flex items-center space-x-1 ml-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-xs text-blue-400 font-medium">Live</span>
                  </div>
                </div>
                
                <p className="text-white/60 text-xs leading-relaxed mb-3 line-clamp-2">
                  {intent.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {intent.requiredSkills.slice(0, 2).map((skill) => (
                    <span 
                      key={skill}
                      className="bg-blue-400/20 text-blue-300 px-2 py-1 rounded-md text-xs font-medium border border-blue-400/30"
                    >
                      {skill}
                    </span>
                  ))}
                  {intent.requiredSkills.length > 2 && (
                    <span className="text-white/40 text-xs px-2 py-1">
                      +{intent.requiredSkills.length - 2}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-300 font-medium">{texts.createdByYou}</span>
                  <span className="text-white/50">{intent.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-white/60" />
          <span className="text-sm font-medium text-white/80">Filter</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'technology', 'research', 'design', 'analytics', 'blockchain', 'marketing', 'security'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                filter === filterOption
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-white/60 hover:text-white/80 hover:bg-white/10 border border-white/10'
              }`}
            >
              {texts[filterOption as keyof typeof texts] || filterOption}
            </button>
          ))}
        </div>
      </div>

      {/* Nearby Intents */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-purple-400" />
          <span>{texts.nearbyOpportunities}</span>
          <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">
            {filteredOtherIntents.length}
          </span>
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">{texts.loading}</p>
          </div>
        ) : filteredOtherIntents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60 text-sm">{texts.noIntents}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOtherIntents.map((intent) => (
              <div 
                key={intent.id}
                className="backdrop-blur-sm rounded-xl p-4 border hover:border-blue-500/30 transition-all cursor-pointer group shadow-lg hover:shadow-xl bg-white/5 border-white/10 hover:bg-white/10"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">
                    {intent.title}
                  </h4>
                  <div className="flex items-center space-x-2 ml-2">
                    {intent.priority === 'urgent' && (
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border ${getPriorityColor(intent.priority)}`}>
                        <Zap className="w-3 h-3" />
                        <span className="text-xs font-medium">{texts.urgent}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg border border-blue-500/30">
                      <Star className="w-3 h-3" />
                      <span className="text-xs font-medium">{intent.matchScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/60 text-xs leading-relaxed mb-3 line-clamp-3">
                  {intent.description}
                </p>

                {/* Skills */}
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

                {/* Budget & Timeline */}
                {(intent.budget || intent.timeline) && (
                  <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                    {intent.budget && (
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">
                        {intent.budget}
                      </span>
                    )}
                    {intent.timeline && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{intent.timeline}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-white/50">
                    <MapPin className="w-3 h-3" />
                    <span>{intent.distance}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/50">
                    <Clock className="w-3 h-3" />
                    <span>{intent.createdAt}</span>
                  </div>
                </div>

                {/* User info */}
                {intent.userName && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <span className="text-xs text-white/40">
                      by {intent.userName}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Intent Button */}
      <div className="flex-shrink-0 p-6 border-t border-white/10">
        <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl border border-blue-500/30">
          {texts.createIntent}
        </button>
      </div>
    </div>
  );
}