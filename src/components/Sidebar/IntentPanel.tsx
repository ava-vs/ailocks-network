import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Search, Tag, Users, Bot, CircleDashed, CheckCircle, Target, ChevronUp, Bell, FileText, X } from 'lucide-react';
import { useUserSession } from '../../hooks/useUserSession';
import { useLocation } from '../../hooks/useLocation';
import toast from 'react-hot-toast';

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
  setIsRightPanelExpanded?: (expanded: boolean) => void;
}

export default function IntentPanel({ isExpanded = false, setIsRightPanelExpanded }: IntentPanelProps) {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [inWorkIntents, setInWorkIntents] = useState<Intent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbStatus, setDbStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [notificationCount, setNotificationCount] = useState(0);

  const { currentUser } = useUserSession();
  const location = useLocation();

  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const response = await fetch('/.netlify/functions/db-status');
        const data = await response.json();
        setDbStatus(data.status === 'ok' ? 'ok' : 'error');
      } catch (err) {
        setDbStatus('error');
      }
    };

    if (location.country) {
      fetchIntents();
    }
    checkDbStatus();
  }, [location.country, currentUser.id]);

  useEffect(() => {
    const handleIntentCreated = (event: CustomEvent) => {
      const newIntent = event.detail;
      setIntents(prev => [newIntent, ...prev]);
      setActiveTab('all');
    };

    const handleSearchResults = (event: CustomEvent) => {
      const { results, query } = event.detail;
      const newResults = results.filter((r: Intent) => !inWorkIntents.some(iw => iw.id === r.id));
      setIntents(newResults);
      setSearchQuery(query);
      setActiveTab('search');
      if (!isExpanded) {
        setNotificationCount(prev => prev + newResults.length);
      }
    };
    
    const handleIntentInWork = (event: CustomEvent) => {
      const intentToAdd = event.detail;
      if (inWorkIntents.some(i => i.id === intentToAdd.id)) {
        toast.error(`Intent is already in "In Work"`);
        setActiveTab('in-work');
        return;
      }
      setInWorkIntents(prev => [intentToAdd, ...prev]);
      setIntents(prev => prev.filter(i => i.id !== intentToAdd.id));
      setActiveTab('in-work');
      toast.success(`Moved to "In Work"`);
    };

    const handleUserChanged = () => {
      fetchIntents();
    };

    window.addEventListener('intentCreated', handleIntentCreated as EventListener);
    window.addEventListener('text-search-results', handleSearchResults as EventListener);
    window.addEventListener('intent-in-work', handleIntentInWork as EventListener);
    window.addEventListener('userChanged', handleUserChanged);

    return () => {
      window.removeEventListener('intentCreated', handleIntentCreated as EventListener);
      window.removeEventListener('text-search-results', handleSearchResults as EventListener);
      window.removeEventListener('intent-in-work', handleIntentInWork as EventListener);
      window.removeEventListener('userChanged', handleUserChanged);
    };
  }, [inWorkIntents, isExpanded]);

  const fetchIntents = async (query = '') => {
    if (!location.country) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/.netlify/functions/intents-list?category=all&country=${location.country}&city=${location.city}&query=${query}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setIntents(data.intents.filter((i: Intent) => !inWorkIntents.some(iw => iw.id === i.id)));
      setError(null);
    } catch (err) {
      setError('Failed to fetch intents.');
      setIntents(getMockIntents());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockIntents = (): Intent[] => [
    { id: 'mock-1', title: 'UX/UI Design for Fintech App (Mock)', description: 'Seeking a creative UX/UI designer...', category: 'Design', distance: '3.7 miles', requiredSkills: ['Figma', 'UX Research', 'Mobile Design'], budget: '$45k', priority: 'high', matchScore: 92, createdAt: new Date().toISOString() },
    { id: 'mock-2', title: '3D Character Artist for JRPG Game (Mock)', description: 'Looking for a talented 3D character artist...', category: 'Design', distance: '152.7 miles', requiredSkills: ['Blender', 'ZBrush', 'Substance Painter'], priority: 'medium', matchScore: 88, createdAt: new Date().toISOString() },
  ];

  const Tabs = () => (
    <div className="flex items-center justify-between mb-4">
       <div className="flex items-center">
        <Bot className="w-5 h-5 mr-2 text-blue-400"/>
        <h3 className="text-lg font-semibold text-white">Intents</h3>
      </div>
      <div className="flex items-center space-x-1 p-1 bg-slate-700/50 rounded-lg">
        <button onClick={() => setActiveTab('all')} className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'all' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-600'}`}>All</button>
        {inWorkIntents.length > 0 && (
          <button onClick={() => setActiveTab('in-work')} className={`relative px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'in-work' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-600'}`}>
            In Work <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-400 text-xs font-bold text-white">{inWorkIntents.length}</span>
          </button>
        )}
        <button onClick={() => setActiveTab('design')} className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'design' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-600'}`}>Design</button>
        <button onClick={() => setActiveTab('tech')} className={`px-3 py-1 text-xs rounded-md transition-colors ${activeTab === 'tech' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-600'}`}>Tech</button>
        {activeTab === 'search' && <button className={`px-3 py-1 text-xs rounded-md bg-purple-500 text-white`}>Search</button>}
      </div>
    </div>
  );

  const filteredIntents = (() => {
    if (activeTab === 'in-work') return inWorkIntents;
    if (activeTab === 'search') return intents;
    if (activeTab === 'all') return intents;
    return intents.filter(intent => intent.category.toLowerCase() === activeTab);
  })();

  const IntentCard = ({ intent }: { intent: Intent }) => (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 transition-all hover:border-slate-600">
      <p className="text-sm font-medium text-white mb-1 truncate">{intent.title}</p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <p className="truncate pr-2">{intent.distance}</p>
        <div className="flex items-center flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${intent.matchScore > 80 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          <p className="ml-1.5">{intent.matchScore}%</p>
        </div>
      </div>
    </div>
  );

  if (!isExpanded) {
    return (
      <div className="p-2 flex flex-col items-center">
        <button
          onClick={() => {
            setIsRightPanelExpanded?.(true);
            setNotificationCount(0);
          }}
          className="relative p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          title={notificationCount > 0 ? `${notificationCount} new intents` : 'Show Intents'}
        >
          <Bot className="w-6 h-6 text-blue-400" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-slate-800">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col bg-slate-800/50 border-l border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Intents</h2>
        <button onClick={() => setIsRightPanelExpanded?.(false)} className="p-1 rounded-full text-gray-400 hover:bg-slate-700">
            <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs />
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><CircleDashed className="w-6 h-6 text-gray-400 animate-spin" /></div>
        ) : error ? (
          <div className="text-center text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</div>
        ) : filteredIntents.length > 0 ? (
          <div className="space-y-2 overflow-y-auto pr-1 -mr-2 flex-1">
            {filteredIntents.map(intent => <IntentCard key={intent.id} intent={intent} />)}
          </div>
        ) : (
          <div className="text-center text-gray-400 p-4">
            <p>No intents found for "{activeTab}" tab.</p>
            {activeTab === 'search' && <p className="text-sm">Query: "{searchQuery}"</p>}
          </div>
        )}
      </div>
    </div>
  );
}