import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { appState, setMode, setLanguage } from '@/lib/store';
import { useLocation } from '@/hooks/useLocation';
import { Bot, Zap, Globe, MapPin, Database, AlertCircle } from 'lucide-react';

export default function StatusBar() {
  const { activeMode, language } = useStore(appState);
  const location = useLocation();
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'loading'>('loading');
  const [aiStatus, setAiStatus] = useState<'available' | 'unavailable' | 'loading'>('loading');

  useEffect(() => {
    // Check database status
    const checkDbStatus = async () => {
      try {
        const response = await fetch('/.netlify/functions/db-status');
        if (response.ok) {
          const data = await response.json();
          setDbStatus(data.database === 'connected' ? 'connected' : 'error');
        } else {
          setDbStatus('error');
        }
      } catch (error) {
        console.error('Failed to check database status:', error);
        setDbStatus('error');
      }
    };

    // Check AI service status
    const checkAiStatus = async () => {
      try {
        const response = await fetch('/.netlify/functions/ai-health-check');
        if (response.ok) {
          const data = await response.json();
          setAiStatus(data.status === 'ok' ? 'available' : 'unavailable');
        } else {
          setAiStatus('unavailable');
        }
      } catch (error) {
        console.error('Failed to check AI service status:', error);
        setAiStatus('unavailable');
      }
    };

    checkDbStatus();
    checkAiStatus();
  }, []);

  const handleModeChange = (mode: string) => {
    setMode(mode as any);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any);
  };

  return (
    <div className="bg-[rgba(26,31,46,0.8)] backdrop-blur-[10px] border border-white/10 rounded-xl px-4 py-2 flex items-center justify-between">
      {/* Left: Mode Selector */}
      <div className="flex items-center space-x-1">
        <div className="flex items-center space-x-1 bg-slate-800/80 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('researcher')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeMode === 'researcher'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-1">
              <Bot className="w-3 h-3" />
              <span>Researcher</span>
            </div>
          </button>
          <button
            onClick={() => handleModeChange('creator')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeMode === 'creator'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>Creator</span>
            </div>
          </button>
          <button
            onClick={() => handleModeChange('analyst')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeMode === 'analyst'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-1">
              <Bot className="w-3 h-3" />
              <span>Analyst</span>
            </div>
          </button>
        </div>
      </div>

      {/* Center: Status Indicators */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Database Status */}
        <div className="flex items-center space-x-1 text-xs">
          <Database className="w-3 h-3" />
          <span className="text-white/60">Database:</span>
          <div className="flex items-center space-x-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              dbStatus === 'connected' ? 'bg-green-400' : 
              dbStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
            }`}></div>
            <span className={
              dbStatus === 'connected' ? 'text-green-400' : 
              dbStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
            }>
              {dbStatus === 'connected' ? 'Connected' : 
               dbStatus === 'error' ? 'Error' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* AI Status */}
        <div className="flex items-center space-x-1 text-xs">
          <Bot className="w-3 h-3" />
          <span className="text-white/60">AI Service:</span>
          <div className="flex items-center space-x-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              aiStatus === 'available' ? 'bg-green-400' : 
              aiStatus === 'unavailable' ? 'bg-red-400' : 'bg-yellow-400'
            }`}></div>
            <span className={
              aiStatus === 'available' ? 'text-green-400' : 
              aiStatus === 'unavailable' ? 'text-red-400' : 'text-yellow-400'
            }>
              {aiStatus === 'available' ? 'Available' : 
               aiStatus === 'unavailable' ? 'Unavailable' : 'Checking...'}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center space-x-1 text-xs">
          <MapPin className="w-3 h-3" />
          <span className="text-white/60">Location:</span>
          <span className="text-white/80">{location.city}, {location.country}</span>
        </div>
      </div>

      {/* Right: Language Selector */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 bg-slate-800/80 rounded-lg p-1">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              language === 'en'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-1">
              <Globe className="w-3 h-3" />
              <span>EN</span>
            </div>
          </button>
          <button
            onClick={() => handleLanguageChange('ru')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              language === 'ru'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-1">
              <Globe className="w-3 h-3" />
              <span>RU</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}