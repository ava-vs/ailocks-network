import { useState, useEffect } from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import { ailockApi } from '@/lib/ailock/api';
import type { FullAilockProfile } from '@/lib/ailock/core';
import AilockDashboard from './AilockDashboard';

export default function MyAilockPage() {
  const { currentUser } = useUserSession();
  const [profile, setProfile] = useState<FullAilockProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser.id && currentUser.id !== 'loading') {
      loadProfile();
    }
  }, [currentUser.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const ailockProfile = await ailockApi.getProfile(currentUser.id);
      setProfile(ailockProfile);
    } catch (err) {
      console.error('Failed to load Ailock profile:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillUpgrade = async (skillId: string) => {
    if (!profile) return;
    
    try {
      await ailockApi.upgradeSkill(profile.id, skillId);
      await loadProfile(); // Refresh profile
    } catch (err) {
      console.error('Failed to upgrade skill:', err);
      // Optionally show a toast notification for the error
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-lg">Loading your Ailock...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">⚠️</span>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Failed to Load Ailock</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button 
            onClick={loadProfile} 
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return null; // or some other placeholder
  }

  return (
    <div className="h-full">
      <AilockDashboard
        isOpen={true}
        onClose={() => window.location.href = '/'}
        profile={profile}
        onSkillUpgrade={handleSkillUpgrade}
      />
    </div>
  );
} 