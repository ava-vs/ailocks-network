import React, { useState } from 'react';
import { Menu, ChevronDown, Zap, MapPin, Globe } from 'lucide-react';
import { toggleMobileMenu } from '@/lib/store';
import { useUserSession } from '@/hooks/useUserSession';
import { useLocation } from '@/hooks/useLocation';

export default function Header() {
  const { currentUser, switchUser, isLirea, demoUsersLoaded } = useUserSession();
  const location = useLocation();
  const [isAilockDropdownOpen, setIsAilockDropdownOpen] = useState(false);

  const AilockDropdown = () => (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-slate-800/95 backdrop-blur-xl border border-blue-500 rounded-2xl p-5 shadow-2xl z-50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <img 
          src="/images/ailock-avatar.png" 
          alt="Ailock Avatar" 
          className="w-8 h-8 object-contain"
          style={{border: 'none', outline: 'none'}}
        />
        <div>
          <h3 className="text-white font-medium">Ailock Assistant</h3>
          <p className="text-sm text-gray-400">Quick Status</p>
        </div>
      </div>
      
      {/* Level Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white">Level Progress</span>
          <span className="bg-blue-500 px-2 py-1 rounded text-xs text-white">Level 1</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" 
               style={{width: '81%'}}></div>
        </div>
        <p className="text-xs text-gray-400 mt-1">2,850 / 3,500 XP | 650 XP to next level</p>
      </div>
      
      {/* Tasks */}
      <div className="mb-4">
        <h4 className="text-white mb-2">Today's Task</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm text-white">Analyze market trends</span>
            </div>
            <span className="text-xs text-green-500">50 XP</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">⏳</span>
              <span className="text-sm text-white">Process user queries</span>
            </div>
            <span className="text-xs text-blue-400">100 XP</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">⏳</span>
              <span className="text-sm text-white">Generate insights</span>
            </div>
            <span className="text-xs text-blue-400">75 XP</span>
          </div>
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={() => setIsAilockDropdownOpen(false)}
          className="flex-1 py-2 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
        <button 
          onClick={() => {
            setIsAilockDropdownOpen(false);
            window.location.href = '/my-ailock';
          }}
          className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
        >
          Full Profile
        </button>
      </div>
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] h-[60px] bg-[rgba(26,31,46,0.95)] backdrop-blur-[20px] border-b border-white/10">
      <div className="grid grid-cols-[2fr_3fr_2fr] h-full px-5 items-center">
        {/* Left Section - Logo & Brand */}
        <div className="flex items-center gap-3 justify-self-start">
          <img 
            src="/images/ailock-logo.png" 
            alt="Ailocks Logo" 
            className="w-8 h-8 object-contain"
            style={{border: 'none', background: 'none', outline: 'none'}}
          />
          <div className="flex flex-col">
            <span className="text-[18px] font-semibold text-white leading-tight">Ailocks</span>
            <span className="text-[12px] font-normal text-white/70 leading-tight">Ai2Ai Network</span>
          </div>
        </div>

        {/* Center Section - Ailock Assistant Card with Progress */}
        <div className="justify-self-start ml-8 relative">
          <button 
            onClick={() => setIsAilockDropdownOpen(!isAilockDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2 bg-slate-700/50 border border-blue-500 rounded-xl hover:bg-slate-600/50 transition-all"
          >
            <img 
              src="/images/ailock-avatar.png" 
              alt="Ailock Avatar" 
              className="w-8 h-8 object-contain"
              style={{border: 'none', outline: 'none'}}
            />
            <div className="flex flex-col items-start">
              <span className="text-white font-medium text-sm">Ailock Assistant</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Level 1</span>
                <div className="w-16 h-1 bg-gray-600 rounded-full overflow-hidden">
                  <div className="w-3/4 h-1 rounded-full" 
                       style={{background: 'linear-gradient(90deg, #13B8F1 0%, #3C8EEC 52%, #00FB82 97%)'}}></div>
                </div>
                <span className="text-xs text-gray-400">Ready</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {isAilockDropdownOpen && <AilockDropdown />}
        </div>

        {/* Right Section - User Info & Controls */}
        <div className="hidden lg:flex items-center gap-4 justify-self-end">
          {/* Role Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-[13px] text-white/80">
              {currentUser.name} • {isLirea ? 'Designer' : 'Manager'}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-[13px] text-white/70">
            <MapPin className="w-3 h-3" />
            <span>{location.city}, {location.country}</span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 text-[13px] text-white/70 cursor-pointer hover:text-white transition-colors">
            <Globe className="w-3 h-3" />
            <span>EN</span>
            <ChevronDown className="w-3 h-3" />
          </div>

          {/* User Switch (if demo users loaded) */}
          {demoUsersLoaded && (
            <button
              onClick={switchUser}
              className="text-[13px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              Switch to {isLirea ? 'Marco' : 'Lirea'}
            </button>
          )}

          {/* Upgrade Button */}
          <a 
            href="/pricing"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 hover:scale-105"
          >
            <Zap className="w-3 h-3" />
            <span>Upgrade</span>
          </a>

          {/* Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-[12px] shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
            {currentUser.name?.charAt(0) || 'U'}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden justify-self-end">
          <button 
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}