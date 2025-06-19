import { useState, useEffect } from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import { ailockService, type FullAilockProfile } from '@/lib/ailock/core';
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
      const ailockProfile = await ailockService.getOrCreateAilock(currentUser.id);
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
      await ailockService.upgradeSkill(profile.id, skillId);
      await loadProfile(); // Refresh profile
    } catch (err) {
      console.error('Failed to upgrade skill:', err);
      // Optionally show a toast notification for the error
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white/60">Loading your Ailock...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">⚠️</div>
        <p className="text-white/60">Failed to load your Ailock. Please try again.</p>
        <button onClick={loadProfile} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Retry
        </button>
      </div>
    );
  }
  
  if (!profile) {
    return null; // or some other placeholder
  }

  return (
    <AilockDashboard
      isOpen={true}
      onClose={() => window.location.href = '/'}
      profile={profile}
      onSkillUpgrade={handleSkillUpgrade}
    />
  );
} 