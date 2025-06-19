import { useEffect, useState } from 'react';
import { Star, Zap, Crown, X } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  skillPointsGained: number;
  xpGained: number;
}

export default function LevelUpModal({ isOpen, onClose, newLevel, skillPointsGained, xpGained }: LevelUpModalProps) {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowParticles(true);
      const timer = setTimeout(() => setShowParticles(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getLevelIcon = () => {
    if (newLevel >= 20) return <Crown className="w-12 h-12 text-yellow-400" />;
    if (newLevel >= 10) return <Star className="w-12 h-12 text-purple-400" />;
    return <Zap className="w-12 h-12 text-blue-400" />;
  };

  const getLevelTitle = () => {
    if (newLevel >= 20) return 'Legendary Ailock!';
    if (newLevel >= 15) return 'Master Level!';
    if (newLevel >= 10) return 'Expert Level!';
    if (newLevel >= 5) return 'Advanced Level!';
    return 'Level Up!';
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
        {/* Particles */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                {getLevelIcon()}
                {showParticles && (
                  <div className="absolute inset-0 animate-pulse">
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-yellow-400/30 to-purple-400/30 blur-xl"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-2">{getLevelTitle()}</h2>
            <p className="text-white/60 mb-6">Your Ailock has reached level {newLevel}!</p>

            {/* Stats */}
            <div className="space-y-4 mb-8">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400 mb-1">+{xpGained} XP</div>
                <div className="text-white/60 text-sm">Experience Gained</div>
              </div>

              <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4">
                <div className="text-2xl font-bold text-amber-400 mb-1">+{skillPointsGained}</div>
                <div className="text-white/60 text-sm">Skill Point{skillPointsGained !== 1 ? 's' : ''} Earned</div>
              </div>
            </div>

            {/* Level Milestone */}
            {newLevel % 5 === 0 && (
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                <div className="text-purple-400 font-medium mb-2">🎉 Milestone Reached!</div>
                <div className="text-white/60 text-sm">
                  {newLevel === 5 && 'Your Ailock is becoming more capable!'}
                  {newLevel === 10 && 'Your Ailock has reached expert level!'}
                  {newLevel === 15 && 'Your Ailock is now a master collaborator!'}
                  {newLevel === 20 && 'Your Ailock has achieved legendary status!'}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-xl transition-all shadow-lg hover:shadow-xl font-medium"
            >
              Continue
            </button>

            {/* Tip */}
            <p className="text-white/40 text-xs mt-4">
              Use your skill points to unlock new abilities in the skill tree!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
