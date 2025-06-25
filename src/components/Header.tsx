import React from 'react';
import { Menu, ChevronDown, Zap, MapPin, Globe } from 'lucide-react';
import AilockHeaderWidget from '@/components/Ailock/AilockHeaderWidget';
import UserHeaderInfo from '@/components/Header/UserHeaderInfo';
import { toggleMobileMenu } from '@/lib/store';
import { useUserSession } from '@/hooks/useUserSession';
import { useLocation } from '@/hooks/useLocation';

export default function Header() {
  const { currentUser, switchUser, isLirea, demoUsersLoaded } = useUserSession();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] h-[60px] bg-[rgba(26,31,46,0.95)] backdrop-blur-[20px] border-b border-white/10">
      <div className="flex items-center justify-between h-full px-5">
        {/* Left Section - Logo & Brand */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <img 
              src="/images/ailock-logo.png" 
              alt="Ailock Logo" 
              className="w-6 h-6"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[18px] font-semibold text-white leading-tight">Ailocks</span>
            <span className="text-[12px] font-normal text-white/70 leading-tight">Ai2Ai Network</span>
          </div>
        </div>

        {/* Center Section - Ailock Assistant Card */}
        <div className="hidden md:flex justify-center flex-1">
          <button className="w-[280px] h-[44px] bg-gradient-to-br from-[#1a1f2e] to-[#252b3a] border border-[#4a9eff] rounded-xl px-4 flex items-center gap-3 hover:transform hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(74,158,255,0.3)] transition-all duration-300 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-400 p-0.5">
              <div className="w-full h-full rounded-lg bg-slate-800/90 flex items-center justify-center">
                <img 
                  src="/images/ailock-avatar.png" 
                  alt="Ailock Avatar" 
                  className="w-5 h-5"
                />
              </div>
            </div>
            <div className="flex-1 text-left">
              <div className="text-[13px] font-medium text-white">Ailock Assistant</div>
              <div className="text-[11px] text-white/60">Level 1 • Ready</div>
            </div>
            <ChevronDown className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Right Section - User Info & Controls */}
        <div className="hidden lg:flex items-center gap-4 flex-1 justify-end">
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
        <div className="md:hidden">
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