import { useState, useEffect } from 'react';
import { Bot, Brain, Star, Sparkles, Zap } from 'lucide-react';

interface AilockAvatarProps {
  level: number;
  avatarStage: string;
  xp: number;
  progressToNextLevel: number;
  characteristics: {
    insight: number;
    efficiency: number;
    creativity: number;
    collaboration: number;
  };
  isAnimating?: boolean;
  showLevelUp?: boolean;
  onLevelUpComplete?: () => void;
}

export default function AilockAvatar({
  level,
  avatarStage,
  xp,
  progressToNextLevel,
  characteristics,
  isAnimating = false,
  showLevelUp = false,
  onLevelUpComplete
}: AilockAvatarProps) {
  const [isBreathing] = useState(true);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  useEffect(() => {
    if (showLevelUp) {
      const timer = setTimeout(() => {
        onLevelUpComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUp, onLevelUpComplete]);

  const getAvatarIcon = () => {
    switch (avatarStage) {
      case 'robot': return Bot;
      case 'analyst': return Zap;
      case 'strategist': return Brain;
      case 'master': return Star;
      case 'singularity': return Sparkles;
      default: return Bot;
    }
  };

  const getAvatarEmoji = () => {
    switch (avatarStage) {
      case 'robot': return '🤖';
      case 'analyst': return '🔬';
      case 'strategist': return '🧠';
      case 'master': return '⭐';
      case 'singularity': return '✨';
      default: return '🤖';
    }
  };

  const getGlowColor = () => {
    const maxCharacteristic = Math.max(
      characteristics.insight,
      characteristics.efficiency,
      characteristics.creativity,
      characteristics.collaboration
    );

    if (characteristics.insight === maxCharacteristic) return 'blue';
    if (characteristics.efficiency === maxCharacteristic) return 'orange';
    if (characteristics.creativity === maxCharacteristic) return 'purple';
    if (characteristics.collaboration === maxCharacteristic) return 'green';
    return 'blue';
  };

  const getGlowIntensity = () => {
    const maxCharacteristic = Math.max(
      characteristics.insight,
      characteristics.efficiency,
      characteristics.creativity,
      characteristics.collaboration
    );
    return Math.min(100, (maxCharacteristic / 50) * 100);
  };

  const getGlowStyle = () => {
    const color = getGlowColor();
    const intensity = getGlowIntensity();
    
    const colors = {
      blue: `rgba(59, 130, 246, ${intensity / 100})`,
      orange: `rgba(249, 115, 22, ${intensity / 100})`,
      purple: `rgba(147, 51, 234, ${intensity / 100})`,
      green: `rgba(34, 197, 94, ${intensity / 100})`
    };

    return {
      filter: `drop-shadow(0 0 ${intensity / 10}px ${colors[color as keyof typeof colors]})`
    };
  };

  const AvatarIcon = getAvatarIcon();

  return (
    <div className="relative flex flex-col items-center">
      {/* Level up animation */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg animate-bounce">
            LEVEL UP! 🎉
          </div>
        </div>
      )}

      {/* Avatar container */}
      <div className="relative">
        {/* Breathing animation ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 ${
            isBreathing ? 'animate-ping' : ''
          } ${pulseAnimation ? 'animate-pulse' : ''}`}
          style={{
            borderColor: getGlowColor() === 'blue' ? '#3b82f6' :
                        getGlowColor() === 'orange' ? '#f97316' :
                        getGlowColor() === 'purple' ? '#9333ea' : '#22c55e',
            animationDuration: '3s'
          }}
        />

        {/* Main avatar */}
        <div
          className={`w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl font-bold text-gray-700 shadow-lg transition-all duration-500 ${
            pulseAnimation ? 'scale-110' : 'scale-100'
          } ${isBreathing ? 'animate-pulse' : ''}`}
          style={getGlowStyle()}
        >
          <span className="relative z-10">{getAvatarEmoji()}</span>
          
          {/* Icon overlay for higher levels */}
          {level >= 10 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <AvatarIcon className="w-8 h-8 text-white opacity-30" />
            </div>
          )}
        </div>

        {/* Level indicator */}
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
          {level}
        </div>

        {/* Characteristic indicators */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
          <div className={`w-2 h-2 rounded-full bg-blue-500 opacity-${Math.min(100, characteristics.insight * 2)}`} />
          <div className={`w-2 h-2 rounded-full bg-orange-500 opacity-${Math.min(100, characteristics.efficiency * 2)}`} />
          <div className={`w-2 h-2 rounded-full bg-purple-500 opacity-${Math.min(100, characteristics.creativity * 2)}`} />
          <div className={`w-2 h-2 rounded-full bg-green-500 opacity-${Math.min(100, characteristics.collaboration * 2)}`} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-12 w-48">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>XP: {xp}</span>
          <span>Level {level}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-500 mt-1">
          {progressToNextLevel}% to next level
        </div>
      </div>

      {/* Evolution stage name */}
      <div className="mt-4 text-center">
        <h3 className="text-lg font-bold text-gray-800 capitalize">
          {avatarStage} Ailock
        </h3>
        <div className="text-sm text-gray-600 mt-1">
          {avatarStage === 'robot' && 'Learning the basics'}
          {avatarStage === 'analyst' && 'Gaining insights'}
          {avatarStage === 'strategist' && 'Thinking strategically'}
          {avatarStage === 'master' && 'Mastering skills'}
          {avatarStage === 'singularity' && 'Transcending limits'}
        </div>
      </div>

      {/* Characteristics display */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span>Insight: {characteristics.insight}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full" />
          <span>Efficiency: {characteristics.efficiency}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span>Creativity: {characteristics.creativity}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Collaboration: {characteristics.collaboration}</span>
        </div>
      </div>
    </div>
  );
} 