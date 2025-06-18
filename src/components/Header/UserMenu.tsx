import { useState } from 'react';
import { User, BarChart3, CreditCard, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../../lib/store';

export default function UserMenu() {
  const language = useStore(currentLanguage);
  const [isOpen, setIsOpen] = useState(false);

  const getTexts = () => {
    const texts = {
      en: {
        myAccount: 'My Account',
        usageAnalytics: 'Usage Analytics',
        premiumPlans: 'Premium Plans',
        apiConfiguration: 'API Configuration',
        signOut: 'Sign Out',
        profile: 'Profile',
        plans: 'Plans',
        usage: 'Usage'
      },
      ru: {
        myAccount: 'Мой аккаунт',
        usageAnalytics: 'Аналитика использования',
        premiumPlans: 'Премиум планы',
        apiConfiguration: 'Настройка API',
        signOut: 'Выйти',
        profile: 'Профиль',
        plans: 'Планы',
        usage: 'Использование'
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 group"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
          {texts.profile}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 border-b border-white/10 mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">AI User</p>
                    <p className="text-xs text-white/60">ai@ailocks.com</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <button className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <User className="w-4 h-4" />
                  <span>{texts.myAccount}</span>
                </button>

                <button className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <BarChart3 className="w-4 h-4" />
                  <span>{texts.usageAnalytics}</span>
                </button>

                <button className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <CreditCard className="w-4 h-4" />
                  <span>{texts.premiumPlans}</span>
                </button>

                <button className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <Settings className="w-4 h-4" />
                  <span>{texts.apiConfiguration}</span>
                </button>

                <div className="border-t border-white/10 pt-1 mt-1">
                  <button className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all">
                    <LogOut className="w-4 h-4" />
                    <span>{texts.signOut}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}