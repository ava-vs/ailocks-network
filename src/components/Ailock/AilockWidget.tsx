import { useState, useEffect } from 'react';
import { Star, Settings } from 'lucide-react';
import AilockAvatar from './AilockAvatar';
import AilockDashboard from './AilockDashboard';
import { ailockApi } from '@/lib/ailock/api';
import type { FullAilockProfile } from '@/lib/ailock/core';
import { useUserSession } from '@/hooks/useUserSession';

export default function AilockWidget() {
  const { currentUser } = useUserSession();
  const [profile, setProfile] = useState<FullAilockProfile | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser.id && currentUser.id !== 'loading') {
      loadProfile();
    }
  }, [currentUser.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const ailockProfile = await ailockApi.getProfile(currentUser.id);
      setProfile(ailockProfile);
    } catch (error) {
      console.error('Failed to load Ailock profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillUpgrade = async (skillId: string) => {
    if (!profile) return;
    
    try {
      await ailockApi.upgradeSkill(profile.id, skillId);
      await loadProfile(); // Refresh profile
    } catch (error) {
      console.error('Failed to upgrade skill:', error);
      throw error;
    }
  };

  if (loading || !profile) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-white/10 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const xpForNextLevel = profile.level < 20 ? [100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, 11500][profile.level - 1] || 11500 : 11500;
  const currentLevelXp = profile.level > 1 ? [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450][profile.level - 2] || 0 : 0;
  const progressXp = profile.xp - currentLevelXp;
  const requiredXp = xpForNextLevel - currentLevelXp;
  const xpPercentage = Math.min((progressXp / requiredXp) * 100, 100);

  return (
    <>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer">
        <div className="flex items-center space-x-3 mb-3" onClick={() => setIsDashboardOpen(true)}>
          <AilockAvatar 
            level={profile.level}
            characteristics={profile.characteristics}
            size="small"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm truncate">{profile.name}</h3>
            <p className="text-white/60 text-xs">Level {profile.level}</p>
          </div>
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <Settings className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">XP Progress</span>
            <span className="text-white/60">{progressXp}/{requiredXp}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Skill Points Notification */}
        {profile.skillPoints > 0 && (
          <div className="mt-3 flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-xs font-medium">
              {profile.skillPoints} skill point{profile.skillPoints !== 1 ? 's' : ''}
            </span>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-blue-400 text-xs font-bold">{profile.totalInteractions}</div>
            <div className="text-white/40 text-xs">Chats</div>
          </div>
          <div>
            <div className="text-purple-400 text-xs font-bold">{profile.skills.filter((s) => s.currentLevel > 0).length}</div>
            <div className="text-white/40 text-xs">Skills</div>
          </div>
          <div>
            <div className="text-emerald-400 text-xs font-bold">{profile.achievements.length}</div>
            <div className="text-white/40 text-xs">Awards</div>
          </div>
        </div>
      </div>

      {/* Dashboard Modal */}
      <AilockDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        profile={profile}
        onSkillUpgrade={handleSkillUpgrade}
      />
    </>
  );
}
