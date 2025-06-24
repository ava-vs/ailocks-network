import { useUserSession } from '@/hooks/useUserSession';
import { useLocation } from '@/hooks/useLocation';
import { Gem, Users, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function UserHeaderInfo() {
  const { currentUser, isHydrated, switchUser, isLirea, isMarco, demoUsersLoaded } = useUserSession();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  if (!isHydrated) {
    return <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg"></div>;
  }

  // Определяем роль пользователя на основе его профиля
  const getUserRole = () => {
    if (isLirea) return 'Designer';
    if (isMarco) return 'Manager'; 
    return 'User';
  };

  const getUserDescription = () => {
    if (isLirea) return 'UX/UI Designer';
    if (isMarco) return 'Project Manager';
    return 'Team Member';
  };

  return (
    <div className="flex items-center space-x-4">
      {/* User Info - Full version for large screens */}
      <div className="hidden lg:flex items-center space-x-2 text-sm text-white/70">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 hover:text-white transition-colors"
          >
            <span>{currentUser.name} • {getUserRole()}</span>
            {demoUsersLoaded && (
              <ChevronDown 
                className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
              />
            )}
          </button>
          
          {/* User Switch Menu */}
          {showUserMenu && demoUsersLoaded && (
            <div className="absolute top-full left-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-lg p-2 min-w-48 shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="text-xs text-white/50 mb-2 px-2">Switch User</div>
              <button
                onClick={() => {
                  switchUser();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-md transition-colors flex items-center space-x-2"
              >
                <span>{isLirea ? '👨‍💼' : '👩‍🎨'}</span>
                <span>{isLirea ? 'Marco • Manager' : 'Lirea • Designer'}</span>
              </button>
            </div>
          )}
        </div>
        <span className="text-white/30">|</span>
        <span>{location.city}, {location.country}</span>
      </div>
      
      {/* User Info - Compact version for medium screens */}
      <div className="hidden md:flex lg:hidden items-center space-x-2 text-sm text-white/70">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-1 hover:text-white transition-colors"
          >
            <span>{currentUser.name}</span>
            {demoUsersLoaded && (
              <ChevronDown 
                className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
              />
            )}
          </button>
          
          {/* User Switch Menu - Mobile */}
          {showUserMenu && demoUsersLoaded && (
            <div className="absolute top-full left-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-lg p-2 min-w-36 shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => {
                  switchUser();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-2 py-1 text-sm text-white/80 hover:bg-white/10 rounded-md transition-colors"
              >
                {isLirea ? 'Marco' : 'Lirea'}
              </button>
            </div>
          )}
        </div>
        <span className="text-white/30">|</span>
        <span>{location.city}</span>
      </div>
      
      {/* Upgrade Button */}
      <a 
        href="/pricing"
        className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition-transform duration-200"
      >
        <Gem className="w-4 h-4" />
        <span className="hidden sm:inline">Upgrade</span>
      </a>
    </div>
  );
} 