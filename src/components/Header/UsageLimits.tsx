import { Zap, Crown } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../../lib/store';

export default function UsageLimits() {
  const language = useStore(currentLanguage);
  
  // Mock usage data - replace with real data
  const usage = {
    current: 75,
    limit: 100,
    plan: 'free' // 'free', 'pro', 'premium'
  };

  const getTexts = () => {
    const texts = {
      en: {
        usage: 'Usage',
        upgrade: 'Upgrade',
        unlimited: 'Unlimited',
        queries: 'queries',
        remaining: 'remaining'
      },
      ru: {
        usage: 'Использование',
        upgrade: 'Обновить',
        unlimited: 'Безлимитно',
        queries: 'запросов',
        remaining: 'осталось'
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();
  const percentage = (usage.current / usage.limit) * 100;
  const remaining = usage.limit - usage.current;

  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const handleUpgradeClick = () => {
    // Navigate to pricing page
    window.location.href = '/pricing';
  };

  if (usage.plan === 'premium') {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl">
        <Crown className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-amber-400">{texts.unlimited}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Usage Display */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
        <Zap className="w-4 h-4 text-blue-400" />
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-white/90">
              {remaining} {texts.remaining}
            </span>
          </div>
          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upgrade Button */}
      {usage.plan === 'free' && (
        <button 
          onClick={handleUpgradeClick}
          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Crown className="w-4 h-4" />
          <span className="text-sm font-medium">{texts.upgrade}</span>
        </button>
      )}
    </div>
  );
}