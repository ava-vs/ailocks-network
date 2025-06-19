import { User, RefreshCw } from 'lucide-react';
import { useUserSession } from '../../hooks/useUserSession';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../../lib/store';

export default function UserSwitcher() {
  const { currentUser, setUser, demoUsers, switchUser, isHydrated, demoUsersLoaded, isLoading } = useUserSession();
  const language = useStore(currentLanguage);

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated || isLoading || !demoUsersLoaded) {
    return (
      <div className="flex items-center gap-3">
        {/* Placeholder that matches the final structure */}
        <div className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white/90">
              Loading...
            </div>
            <div className="text-xs text-white/60">
              Demo User
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for demo users
  if (!demoUsers.lirea || !demoUsers.marco) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-red-200">
              Error loading users
            </div>
            <div className="text-xs text-red-300">
              Demo users not found
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getTexts = () => {
    const texts = {
      en: {
        demoUser: 'Demo User',
        switchUser: 'Switch User',
        designer: 'Designer from Rio',
        manager: 'Manager from Rio'
      },
      ru: {
        demoUser: 'Демо пользователь',
        switchUser: 'Сменить пользователя',
        designer: 'Дизайнер из Рио',
        manager: 'Менеджер из Рио'
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  return (
    <div className="flex items-center gap-3">
      {/* Current User Display */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-white/90">
            {currentUser.name}
          </div>
          <div className="text-xs text-white/60">
            {currentUser.name === 'Lirea' ? texts.designer : texts.manager}
          </div>
        </div>
      </div>

      {/* User Switcher */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/60">{texts.demoUser}:</span>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => demoUsers.lirea && setUser(demoUsers.lirea)}
            className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
              currentUser.name === 'Lirea'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Lirea
          </button>
          <button
            onClick={() => demoUsers.marco && setUser(demoUsers.marco)}
            className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
              currentUser.name === 'Marco'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Marco
          </button>
        </div>
        
        {/* Quick Switch Button */}
        <button
          onClick={switchUser}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          title={texts.switchUser}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}