import { useState, useEffect } from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import { ailockApi } from '@/lib/ailock/api';
import type { FullAilockProfile, AilockSkill, AilockAchievement, XpEvent } from '@/lib/ailock/shared';
import { getLevelInfo, getSkillEffect } from '@/lib/ailock/shared';
import { SKILL_TREE, BRANCH_COLORS } from '@/lib/ailock/skills';
import AilockAvatar from './AilockAvatar';
import CharacteristicsPanel from './CharacteristicsPanel';
import SkillTreeCanvas from './SkillTreeCanvas';
import { ArrowLeft, Star, Zap, Trophy, TrendingUp, CheckCircle, Clock, Award, Brain, Sparkles, Crown, Target, Cpu } from 'lucide-react';

export default function MyAilockPage() {
  const { currentUser } = useUserSession();
  const [profile, setProfile] = useState<FullAilockProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'achievements'>('overview');
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

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
      // Notify other components about profile update
      window.dispatchEvent(new CustomEvent('ailock-profile-updated'));
    } catch (err) {
      console.error('Failed to upgrade skill:', err);
      // Optionally show a toast notification for the error
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-900/95 to-slate-800/95">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-lg">Loading your Ailock...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-900/95 to-slate-800/95">
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
    return null;
  }

  const levelInfo = getLevelInfo(profile.xp);
  
  const getAvatarGradient = () => {
    if (profile.level >= 15) return 'from-purple-400 via-pink-400 to-yellow-400';
    if (profile.level >= 10) return 'from-blue-400 via-purple-400 to-pink-400';
    if (profile.level >= 5) return 'from-green-400 via-blue-400 to-purple-400';
    return 'from-cyan-400 via-blue-400 to-indigo-400';
  };

  // Daily tasks based on XP event types
  const dailyTasks = [
    { id: 1, text: 'Analyze market trends', completed: false, xp: 50 },
    { id: 2, text: 'Process user queries', completed: false, xp: 100 },
    { id: 3, text: 'Generate insights', completed: false, xp: 75 }
  ];

  // Premium tasks based on skill tree
  const premiumTasks = [
    {
      id: 1, 
      title: 'Master advanced algorithms',
      description: 'Unlock neural network optimization',
      xp: 500,
      hours: 2,
      pro: true
    },
    {
      id: 2, 
      title: 'Master advanced algorithms',
      description: 'Unlock neural network optimization',
      xp: 400,
      hours: 10,
      pro: true
    },
    {
      id: 3, 
      title: 'Master advanced algorithms',
      description: 'Unlock neural network optimization',
      xp: 600,
      hours: 15,
      pro: true
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-900/95 to-slate-800/95 p-6">
      {/* Back Button */}
      <div className="mb-6">
        <a 
          href="/" 
          className="inline-flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </a>
      </div>

      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Ailock Assistant Profile</h1>
        <p className="text-white/60">Quick Status</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Avatar and Level */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center">
              <div className="relative mb-4">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getAvatarGradient()} p-1`}>
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src="/images/ailock-character.png" 
                      alt="Ailock Avatar" 
                      className="w-24 h-24 object-contain animate-breathe"
                      style={{border: 'none', outline: 'none'}}
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full px-3 py-1 flex items-center space-x-1 shadow-lg border-2 border-slate-800">
                  <Star className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-bold">{profile.level}</span>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
              <p className="text-white/60 text-sm">Level {profile.level} AI Companion</p>
            </div>

            {/* Level Progress */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Level Progress</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Level {profile.level}</span>
                  <span className="text-white/80">{profile.xp} XP</span>
                </div>
                
                <div className="w-full bg-white/10 rounded-lg h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${levelInfo.progressPercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-white/60">
                  <span>{levelInfo.progressXp} / {levelInfo.xpNeededForNextLevel} XP</span>
                  <span>{levelInfo.level < 20 ? `${levelInfo.xpToNextLevel} XP to next level` : 'Max Level'}</span>
                </div>
              </div>
              
              {profile.skillPoints > 0 && (
                <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 font-medium">
                      {profile.skillPoints} skill point{profile.skillPoints !== 1 ? 's' : ''} available!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Skill */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Basic skill</h3>
                  <p className="text-white/60 text-sm">Semantic search</p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Stats</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-blue-400">{profile.xp}</div>
                  <div className="text-white/60 text-sm">Total XP</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-purple-400">{profile.recentXpHistory.length}</div>
                  <div className="text-white/60 text-sm">Tasks Completed</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-emerald-400">94%</div>
                  <div className="text-white/60 text-sm">Success Rate</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="text-3xl font-bold text-amber-400">23</div>
                  <div className="text-white/60 text-sm">Days Active</div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Achievements</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-white font-medium mb-1">Expert Matcher</div>
                  <div className="text-white/60 text-xs">95%+ accuracy</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Search className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-white font-medium mb-1">Research Master</div>
                  <div className="text-white/60 text-xs">100+ searches</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-white font-medium mb-1">Speed Demon</div>
                  <div className="text-white/60 text-xs">Quick responses</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-white font-medium mb-1">Rising Star</div>
                  <div className="text-white/60 text-xs">Level 1 reached</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Today's Tasks */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Today's Task</h3>
              
              <div className="space-y-3">
                {dailyTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-500 bg-transparent border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className={`text-sm ${task.completed ? 'text-white/60 line-through' : 'text-white/80'}`}>
                        {task.text}
                      </span>
                    </div>
                    <span className="text-emerald-400 text-sm font-medium">{task.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Growth Accelerators */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Premium Growth Accelerators</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-white font-medium mb-1 text-sm">Turbo Training</div>
                  <div className="text-white/60 text-xs mb-2">Learn 3x faster</div>
                  <div className="text-green-400 text-xs font-medium">+200% XP</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-white font-medium mb-1 text-sm">Advanced Insights</div>
                  <div className="text-white/60 text-xs mb-2">Deeper analysis</div>
                  <div className="text-green-400 text-xs font-medium">+150% accuracy</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-white font-medium mb-1 text-sm">Bonus Tasks</div>
                  <div className="text-white/60 text-xs mb-2">Exclusive challenges</div>
                  <div className="text-green-400 text-xs font-medium">+300 XP/day</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Crown className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-white font-medium mb-1 text-sm">AI Mentor</div>
                  <div className="text-white/60 text-xs mb-2">Personal guidance</div>
                  <div className="text-green-400 text-xs font-medium">Custom path</div>
                </div>
              </div>
            </div>

            {/* Premium Tasks Available */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Premium Tasks Available</h3>
              
              <div className="space-y-3">
                {premiumTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center">
                          <Brain className="w-3 h-3 text-amber-400" />
                        </div>
                        <span className="text-white font-medium text-sm">{task.title}</span>
                      </div>
                      {task.pro && (
                        <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded border border-yellow-500/30">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs mb-2">{task.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">{task.hours} hours</span>
                      <span className="text-emerald-400 font-medium">+{task.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade Button */}
            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-amber-400 mb-2">Upgraded to PRO =</h3>
              <p className="text-white/80 mb-4">50% faster growth</p>
              <a 
                href="/pricing" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 transition-colors"
              >
                View Plans
              </a>
            </div>
          </div>
        </div>

        {/* Tabs for Skills and Achievements */}
        <div className="mt-8 border-t border-white/10 pt-8">
          <div className="flex border-b border-white/10 mb-6">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'skills', label: 'Skills', icon: Zap },
              { id: 'achievements', label: 'Achievements', icon: Trophy }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'skills' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Skill Tree */}
              <div className="lg:col-span-2">
                <SkillTreeCanvas
                  skills={profile.skills}
                  skillPoints={profile.skillPoints}
                  onSkillUpgrade={handleSkillUpgrade}
                  onSkillHover={setHoveredSkill}
                />
              </div>
              
              {/* Skill Details */}
              <div className="space-y-6">
                {hoveredSkill && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Skill Details</h3>
                    
                    {(() => {
                      const skillDef = SKILL_TREE[hoveredSkill];
                      const userSkill = profile.skills.find((s: AilockSkill) => s.skillId === hoveredSkill);
                      
                      if (!skillDef) return null;
                      
                      return (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white font-medium">{skillDef.name}</h4>
                            <p className="text-white/60 text-sm">{skillDef.description}</p>
                          </div>
                          
                          <div>
                            <span className="text-white/80 text-sm">Branch: </span>
                            <span className="text-blue-400 text-sm capitalize">{skillDef.branch}</span>
                          </div>
                          
                          <div>
                            <span className="text-white/80 text-sm">Level: </span>
                            <span className="text-white text-sm">
                              {userSkill?.currentLevel || 0} / {skillDef.maxLevel}
                            </span>
                          </div>
                          
                          <div>
                            <h5 className="text-white/80 text-sm mb-2">Current Effect:</h5>
                            <p className="text-white/60 text-sm">
                              {getSkillEffect(hoveredSkill, userSkill?.currentLevel || 1)}
                            </p>
                          </div>
                          
                          {userSkill && userSkill.currentLevel < skillDef.maxLevel && (
                            <div>
                              <h5 className="text-white/80 text-sm mb-2">Next Level:</h5>
                              <p className="text-emerald-400 text-sm">
                                {getSkillEffect(hoveredSkill, userSkill.currentLevel + 1)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* Unlocked Skills List */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Unlocked Skills</h3>
                  
                  <div className="space-y-3">
                    {profile.skills.filter((s: AilockSkill) => s.currentLevel > 0).map((skill: AilockSkill) => (
                      <div key={skill.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white text-sm font-medium">{skill.skillName}</p>
                          <p className="text-white/60 text-xs capitalize">{skill.branch} • Level {skill.currentLevel}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white/60 text-xs">Used {skill.usageCount} times</div>
                          <div className="text-emerald-400 text-xs">{Math.round(skill.successRate * 100)}% success</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.achievements.length > 0 ? (
                profile.achievements.map((achievement: AilockAchievement) => (
                  <div 
                    key={achievement.id}
                    className={`bg-white/5 border rounded-xl p-6 ${
                      achievement.rarity === 'legendary' ? 'border-yellow-500/50 bg-yellow-500/10' :
                      achievement.rarity === 'epic' ? 'border-purple-500/50 bg-purple-500/10' :
                      achievement.rarity === 'rare' ? 'border-blue-500/50 bg-blue-500/10' :
                      'border-white/10'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{achievement.icon}</div>
                      <h3 className="text-white font-semibold mb-2">{achievement.achievementName}</h3>
                      <p className="text-white/60 text-sm mb-3">{achievement.achievementDescription}</p>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        achievement.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                        achievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                        achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {achievement.rarity.toUpperCase()}
                      </div>
                      <div className="text-white/40 text-xs mt-2">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No achievements unlocked yet</p>
                  <p className="text-white/40 text-sm">Keep using your Ailock to earn achievements!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}