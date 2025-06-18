import React, { useEffect, useState } from 'react';
import { Lock, Zap } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentMode, currentLanguage, setMode, setLanguage, type AIMode, isClientInitialized } from '../lib/store';
import UserMenu from './Header/UserMenu';
import UsageLimits from './Header/UsageLimits';
import LocationSelector from './Header/LocationSelector';
import UserSwitcher from './Header/UserSwitcher';

export default function Header() {
  const mode = useStore(currentMode);
  const language = useStore(currentLanguage);
  const clientInitialized = useStore(isClientInitialized);
  const [isHydrated, setIsHydrated] = useState(false);

  // Apply user's saved language preference after hydration
  useEffect(() => {
    setIsHydrated(true);
    
    // Only access localStorage after component is hydrated and client is initialized
    if (clientInitialized && typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('ailocks-language');
      if (savedLang && ['en', 'ru'].includes(savedLang) && savedLang !== language) {
        setLanguage(savedLang as 'en' | 'ru');
      }
    }
  }, [language, clientInitialized]);

  const modes: Array<{ id: AIMode; label: string; description: string; gradient: string }> = [
    { 
      id: 'researcher', 
      label: '🔍 Researcher', 
      description: 'Research & Analysis',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'creator', 
      label: '🛠️ Creator', 
      description: 'Create & Build',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'analyst', 
      label: '📊 Analyst', 
      description: 'Strategic Analysis',
      gradient: 'from-emerald-500 to-teal-500'
    }
  ];

  const handleModeChange = (newMode: AIMode) => {
    setMode(newMode);
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as 'en' | 'ru');
  };

  return (
    <header className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 shadow-2xl flex-shrink-0">
      <div className="flex items-center justify-between max-w-full mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-2xl">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl text-white">Ailocks</span>
            <div className="text-sm text-white/60 font-medium">Ai2Ai Network</div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-1 bg-white/5 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
          {modes.map((modeOption) => (
            <button
              key={modeOption.id}
              onClick={() => handleModeChange(modeOption.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === modeOption.id
                  ? `bg-gradient-to-r ${modeOption.gradient} text-white shadow-lg ring-1 ring-white/20`
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
              title={modeOption.description}
            >
              {modeOption.label}
            </button>
          ))}
        </div>

        {/* Right Section: User Switcher + Location + Usage + Language + User Menu */}
        <div className="flex items-center space-x-4">
          {/* User Switcher - Only show after hydration */}
          {isHydrated && <UserSwitcher />}

          {/* Location Selector - Only show after hydration */}
          {isHydrated && <LocationSelector />}

          {/* Usage Limits */}
          <UsageLimits />

          {/* Language Selector */}
          <select 
            value={language}
            onChange={handleLanguageChange}
            className="bg-white/5 text-white/90 text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
          >
            <option value="en" className="bg-slate-800 text-white">🇺🇸 EN</option>
            <option value="ru" className="bg-slate-800 text-white">🇷🇺 RU</option>
          </select>

          {/* Connection Status */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-400 font-medium">Connected</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}