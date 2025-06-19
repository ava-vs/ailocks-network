import { useState, useEffect } from 'react';
import { Trophy, Clock, TrendingUp, Star, Zap, Award, ChevronDown, ChevronUp } from 'lucide-react';
import AilockAvatar from './AilockAvatar';
import SkillTreeCanvas from './SkillTreeCanvas';

interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: string;
  unlockedAt: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  branch: string;
  level: number;
  maxLevel: number;
  isUnlocked: boolean;
  dependencies: string[];
  effects: string[];
  position: { x: number; y: number };
}

interface AilockProfile {
  id: string;
  name: string;
  level: number;
  xp: number;
  skillPoints: number;
  avatarStage: string;
  progressToNextLevel: number;
  nextLevelXp: number;
  insight: number;
  efficiency: number;
  creativity: number;
  collaboration: number;
}

interface RecentActivity {
  id: string;
  eventType: string;
  xpGained: number;
  description: string;
  timeAgo: string;
}

interface AilockDashboardProps {
  userId: string;
}

export default function AilockDashboard({ userId }: AilockDashboardProps) {
  const [profile, setProfile] = useState<AilockProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    skills: true,
    achievements: true,
    activity: true
  });

  useEffect(() => {
    loadAilockProfile();
  }, [userId]);

  const loadAilockProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/.netlify/functions/ailock-profile?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load profile: ${response.status}`);
      }

      const data = await response.json();
      setProfile(data.ailock);
      setSkills(data.skills || []);
      setAchievements(data.achievements || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      console.error('Error loading Ailock profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillUpgrade = async (skillId: string) => {
    try {
      const response = await fetch('/.netlify/functions/ailock-upgrade-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skillId })
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade skill');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh profile to get updated data
        await loadAilockProfile();
        
        // Show level up animation if leveled up
        if (result.leveledUp) {
          setShowLevelUp(true);
        }
      }
    } catch (err) {
      console.error('Error upgrading skill:', err);
    }
  };

  const handleGainXp = async (eventType: string, context = {}, description?: string) => {
    try {
      const response = await fetch('/.netlify/functions/ailock-gain-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, eventType, context, description })
      });

      if (!response.ok) {
        throw new Error('Failed to gain XP');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh profile to get updated data
        await loadAilockProfile();
        
        // Show level up animation if leveled up
        if (result.leveledUp) {
          setShowLevelUp(true);
        }
      }
    } catch (err) {
      console.error('Error gaining XP:', err);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Ailock...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          {error || 'Failed to load Ailock profile'}
        </div>
        <button 
          onClick={loadAilockProfile}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Your Ailock Evolution
        </h1>
        <p className="text-gray-600">
          Level up your AI companion and unlock powerful abilities
        </p>
      </div>

      {/* Avatar Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center">
          <AilockAvatar
            level={profile.level}
            avatarStage={profile.avatarStage}
            xp={profile.xp}
            progressToNextLevel={profile.progressToNextLevel}
            characteristics={{
              insight: profile.insight,
              efficiency: profile.efficiency,
              creativity: profile.creativity,
              collaboration: profile.collaboration
            }}
            showLevelUp={showLevelUp}
            onLevelUpComplete={() => setShowLevelUp(false)}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{profile.skillPoints}</div>
          <div className="text-sm text-gray-600">Skill Points</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6 text-center">
          <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{achievements.length}</div>
          <div className="text-sm text-gray-600">Achievements</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 text-center">
          <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">{skills.filter(s => s.isUnlocked).length}</div>
          <div className="text-sm text-gray-600">Skills Unlocked</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-6 text-center">
          <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">{profile.xp}</div>
          <div className="text-sm text-gray-600">Total XP</div>
        </div>
      </div>

      {/* Skill Tree Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div 
          className="flex items-center justify-between cursor-pointer mb-6"
          onClick={() => toggleSection('skills')}
        >
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-blue-600" />
            Skill Tree
          </h2>
          {expandedSections.skills ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.skills && (
          <div className="space-y-4">
            <SkillTreeCanvas
              skills={skills}
              availableSkillPoints={profile.skillPoints}
              onSkillUpgrade={handleSkillUpgrade}
              onSkillHover={setHoveredSkill}
            />
            
            {/* Skill details */}
            {hoveredSkill && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-bold text-lg">{hoveredSkill.name}</h3>
                <p className="text-gray-600 mb-2">{hoveredSkill.description}</p>
                <div className="text-sm">
                  <div className="font-medium">Current Level: {hoveredSkill.level}/{hoveredSkill.maxLevel}</div>
                  {hoveredSkill.effects.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Effects:</div>
                      <ul className="list-disc list-inside ml-2">
                        {hoveredSkill.effects.slice(0, hoveredSkill.level).map((effect, i) => (
                          <li key={i} className="text-green-600">{effect}</li>
                        ))}
                        {hoveredSkill.effects.slice(hoveredSkill.level).map((effect, i) => (
                          <li key={i} className="text-gray-400">{effect} (locked)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div 
          className="flex items-center justify-between cursor-pointer mb-6"
          onClick={() => toggleSection('achievements')}
        >
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Award className="w-6 h-6 mr-2 text-yellow-600" />
            Achievements
          </h2>
          {expandedSections.achievements ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.achievements && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(achievement => (
              <div key={achievement.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <Trophy className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(achievement.rarity)}`}>
                    {achievement.rarity}
                  </span>
                </div>
                <h3 className="font-bold">{achievement.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                <div className="text-xs text-gray-500">{achievement.unlockedAt}</div>
              </div>
            ))}
            {achievements.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No achievements yet. Keep using Ailock to unlock them!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div 
          className="flex items-center justify-between cursor-pointer mb-6"
          onClick={() => toggleSection('activity')}
        >
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-green-600" />
            Recent Activity
          </h2>
          {expandedSections.activity ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expandedSections.activity && (
          <div className="space-y-3">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">{activity.description}</div>
                    <div className="text-sm text-gray-500">{activity.timeAgo}</div>
                  </div>
                </div>
                <div className="text-green-600 font-bold">+{activity.xpGained} XP</div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No recent activity. Start chatting with Ailock to see progress!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test XP Button (for demo) */}
      <div className="text-center">
        <button
          onClick={() => handleGainXp('chat_message', {}, 'Demo XP gain')}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
        >
          Test: Gain 5 XP 🧪
        </button>
      </div>
    </div>
  );
} 