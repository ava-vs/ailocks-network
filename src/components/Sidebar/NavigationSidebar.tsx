import { useState, useEffect } from 'react';
import { Clock, Star, Folder, Settings, Search, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../../lib/store';

interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  mode: string;
}

interface SavedItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  timestamp: Date;
}

interface Workspace {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  lastActivity: Date;
  collaborators: number;
}

export default function NavigationSidebar() {
  const language = useStore(currentLanguage);
  const [expandedSections, setExpandedSections] = useState({
    history: true,
    saved: true,
    workspaces: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize with empty arrays to avoid SSR/client mismatch
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Populate mock data after component mounts to avoid hydration mismatch
  useEffect(() => {
    const now = Date.now();
    setCurrentTime(now);
    
    setQueryHistory([
      { id: '1', query: 'Analyze market trends in AI sector', timestamp: new Date(now - 1000 * 60 * 30), mode: 'analyst' },
      { id: '2', query: 'Research blockchain adoption rates', timestamp: new Date(now - 1000 * 60 * 60 * 2), mode: 'researcher' },
      { id: '3', query: 'Create marketing strategy for startup', timestamp: new Date(now - 1000 * 60 * 60 * 4), mode: 'creator' },
      { id: '4', query: 'Find collaboration opportunities', timestamp: new Date(now - 1000 * 60 * 60 * 24), mode: 'researcher' },
      { id: '5', query: 'Design user experience flow', timestamp: new Date(now - 1000 * 60 * 60 * 24 * 2), mode: 'creator' },
    ]);

    setSavedItems([
      { id: '1', title: 'AI Market Analysis Report', content: 'Comprehensive analysis...', tags: ['AI', 'Market'], timestamp: new Date(now) },
      { id: '2', title: 'Blockchain Research', content: 'Key findings...', tags: ['Blockchain', 'Research'], timestamp: new Date(now - 1000 * 60 * 60) },
      { id: '3', title: 'Startup Strategy', content: 'Strategic recommendations...', tags: ['Strategy', 'Startup'], timestamp: new Date(now - 1000 * 60 * 60 * 2) },
    ]);

    setWorkspaces([
      { id: '1', name: 'AI Research Project', status: 'active', lastActivity: new Date(now), collaborators: 3 },
      { id: '2', name: 'Market Analysis', status: 'completed', lastActivity: new Date(now - 1000 * 60 * 60 * 24), collaborators: 2 },
      { id: '3', name: 'Product Strategy', status: 'paused', lastActivity: new Date(now - 1000 * 60 * 60 * 48), collaborators: 1 },
    ]);
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getTexts = () => {
    const texts = {
      en: {
        queryHistory: 'Query History',
        savedItems: 'Saved Items',
        workspaces: 'Workspaces',
        settings: 'Settings',
        searchHistory: 'Search history...',
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        active: 'Active',
        completed: 'Completed',
        paused: 'Paused',
        collaborators: 'collaborators'
      },
      ru: {
        queryHistory: 'История запросов',
        savedItems: 'Сохраненное',
        workspaces: 'Рабочие области',
        settings: 'Настройки',
        searchHistory: 'Поиск в истории...',
        today: 'Сегодня',
        yesterday: 'Вчера',
        thisWeek: 'На этой неделе',
        active: 'Активно',
        completed: 'Завершено',
        paused: 'Приостановлено',
        collaborators: 'участников'
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  const formatTime = (date: Date) => {
    // Use stable currentTime to avoid hydration mismatch
    if (currentTime === 0) return ''; // Return empty string during SSR
    
    const diffMs = currentTime - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return texts.yesterday;
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'researcher': return 'text-blue-400';
      case 'creator': return 'text-purple-400';
      case 'analyst': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="w-60 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-r border-white/10 flex flex-col h-full">
      {/* Query History Section */}
      <div className="p-4 border-b border-white/5">
        <button
          onClick={() => toggleSection('history')}
          className="flex items-center justify-between w-full text-white/90 hover:text-white transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-sm">{texts.queryHistory}</span>
          </div>
          {expandedSections.history ? (
            <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" />
          )}
        </button>

        {expandedSections.history && (
          <div className="mt-4 space-y-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white/40" />
              <input
                type="text"
                placeholder={texts.searchHistory}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white/90 placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {queryHistory.map((item) => (
                <div
                  key={item.id}
                  className="group p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs text-white/80 leading-relaxed line-clamp-2 flex-1">
                      {item.query}
                    </p>
                    <button className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-500/20 rounded transition-all">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-medium ${getModeColor(item.mode)}`}>
                      {item.mode}
                    </span>
                    <span className="text-xs text-white/40">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Saved Items Section */}
      <div className="p-4 border-b border-white/5">
        <button
          onClick={() => toggleSection('saved')}
          className="flex items-center justify-between w-full text-white/90 hover:text-white transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-sm">{texts.savedItems}</span>
          </div>
          {expandedSections.saved ? (
            <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" />
          )}
        </button>

        {expandedSections.saved && (
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="group p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 border border-white/5"
              >
                <h4 className="text-xs font-medium text-white/90 line-clamp-1 mb-1">
                  {item.title}
                </h4>
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-md border border-blue-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-white/40">
                  {formatTime(item.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workspaces Section */}
      <div className="p-4 border-b border-white/5 flex-1">
        <button
          onClick={() => toggleSection('workspaces')}
          className="flex items-center justify-between w-full text-white/90 hover:text-white transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <Folder className="w-4 h-4 text-purple-400" />
            <span className="font-medium text-sm">{texts.workspaces}</span>
          </div>
          {expandedSections.workspaces ? (
            <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" />
          )}
        </button>

        {expandedSections.workspaces && (
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="group p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-white/90 line-clamp-1">
                    {workspace.name}
                  </h4>
                  <span className={`px-2 py-0.5 text-xs rounded-md border ${getStatusColor(workspace.status)}`}>
                    {texts[workspace.status as keyof typeof texts]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>{workspace.collaborators} {texts.collaborators}</span>
                  <span>{formatTime(workspace.lastActivity)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="p-4">
        <button className="flex items-center space-x-3 w-full text-white/70 hover:text-white transition-colors group">
          <Settings className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          <span className="font-medium text-sm">{texts.settings}</span>
        </button>
      </div>
    </div>
  );
}