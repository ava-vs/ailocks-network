import React, { useState, useEffect } from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import { ailockApi } from '@/lib/ailock/api';
import type { FullAilockProfile } from '@/lib/ailock/core';
import AilockQuickStatus from './AilockQuickStatus';

export default function AilockHeaderWidget() {
  const { currentUser } = useUserSession();
  const [profile, setProfile] = useState<FullAilockProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickStatusOpen, setIsQuickStatusOpen] = useState(false);

  useEffect(() => {
    if (currentUser.id && currentUser.id !== 'loading') {
      loadProfile();
    }
  }, [currentUser.id]);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (currentUser.id && currentUser.id !== 'loading') {
        loadProfile();
      }
    };

    window.addEventListener('ailock-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('ailock-profile-updated', handleProfileUpdate);
  }, [currentUser.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const ailockProfile = await ailockApi.getProfile(currentUser.id);
      setProfile(ailockProfile);
    } catch (error) {
      console.error('Failed to load Ailock profile for header:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-white/5 rounded-lg animate-pulse" />
        <div className="w-32 h-6 bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  const xpForNextLevel = profile.level < 20 ? [100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, 11500][profile.level - 1] || 11500 : 11500;
  const currentLevelXp = profile.level > 1 ? [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450][profile.level - 2] || 0 : 0;
  const progressXp = profile.xp - currentLevelXp;
  const requiredXp = xpForNextLevel - currentLevelXp;
  const xpPercentage = Math.min((progressXp / requiredXp) * 100, 100);

  const getAvatarGradient = () => {
    if (profile.level >= 15) return 'from-purple-400 via-pink-400 to-yellow-400';
    if (profile.level >= 10) return 'from-blue-400 via-purple-400 to-pink-400';
    if (profile.level >= 5) return 'from-green-400 via-blue-400 to-purple-400';
          return 'from-cyan-400 via-blue-400 to-indigo-400';
    };

    const handleOpenFullProfile = () => {
      window.location.href = '/my-ailock';
    };

    return (
      <>
        <div className="relative">
          <button 
            onClick={() => setIsQuickStatusOpen(true)}
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-2 transition-colors cursor-pointer border border-white/20 ailock-widget"
          >
            {/* Avatar */}
            <div className="relative">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getAvatarGradient()} p-0.5`}>
                <div className="w-full h-full rounded-lg bg-slate-800/90 flex items-center justify-center">
                  {/* CRITICAL FIX 2: Remove Image Border */}
                  <img 
                    src="/images/ailock-avatar.png" 
                    alt="Ailock Avatar" 
                    className="w-8 h-8 object-contain animate-breathe"
                    style={{border: 'none', outline: 'none'}}
                  />
                </div>
              </div>
              {/* Level badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {profile.level}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-white/90">{profile.name}</span>
                <span className="text-xs text-white/60">Level {profile.level}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-white/10 rounded-full h-1.5 overflow-hidden" title={`${progressXp}/${requiredXp} XP`}>
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                    style={{ width: `${xpPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-white/50">{profile.xp} XP</span>
              </div>
            </div>
            
            {/* CRITICAL FIX 2: Green triangle dropdown */}
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <AilockQuickStatus
            isOpen={isQuickStatusOpen}
            onClose={() => setIsQuickStatusOpen(false)}
            profile={profile}
            onOpenFullProfile={handleOpenFullProfile}
          />
        </div>
      </>
    );
  }