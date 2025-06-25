import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, Star, Clock, MapPin, Home, LogOut } from 'lucide-react';
import CollapsibleSidebar from './CollapsibleSidebar';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isExpanded: boolean;
  isActive?: boolean;
}

const NavLink = ({ href, children, isExpanded, isActive = false }: NavLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center w-full h-12 rounded-lg transition-all duration-200 group relative",
        isActive 
          ? "bg-[rgba(74,158,255,0.15)] text-white" 
          : "text-white/60 hover:bg-white/5 hover:text-white",
        !isExpanded && "justify-center"
      )}
    >
      <div className={cn(
        "flex items-center",
        isExpanded ? "px-4 gap-3" : "justify-center w-full"
      )}>
        {children}
      </div>
    </a>
  );
};

interface GradientIconProps {
  children: React.ReactNode;
  isActive?: boolean;
}

const GradientIcon = ({ children, isActive = false }: GradientIconProps) => {
  return (
    <div className={cn(
      "w-5 h-5 transition-all duration-200",
      isActive 
        ? "text-transparent bg-gradient-to-br from-[#E4F0FE] to-[#2A8ED7] bg-clip-text" 
        : "text-transparent bg-gradient-to-br from-[#E4F0FE]/70 to-[#2A8ED7]/70 bg-clip-text hover:from-[#E4F0FE] hover:to-[#2A8ED7] group-hover:scale-110"
    )}>
      {children}
    </div>
  );
};

interface NavigationSidebarProps {
  isExpanded?: boolean;
}

function NavigationSidebar({ isExpanded = false }: NavigationSidebarProps) {
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const handleSignOut = () => {
    console.log("Signing out...");
  };

  return (
    <div className="flex flex-col h-full p-4 text-white">
      <nav className="flex-grow space-y-2">
        <NavLink href="/" isExpanded={isExpanded} isActive={pathname === '/'}>
          <GradientIcon isActive={pathname === '/'}>
            <Home className="w-5 h-5" />
          </GradientIcon>
          {isExpanded && <span className="font-medium">Home</span>}
        </NavLink>

        <NavLink href="/query-history" isExpanded={isExpanded} isActive={pathname === '/query-history'}>
          <GradientIcon isActive={pathname === '/query-history'}>
            <Search className="w-5 h-5" />
          </GradientIcon>
          {isExpanded && <span className="font-medium">Query History</span>}
        </NavLink>

        <NavLink href="/saved-intents" isExpanded={isExpanded} isActive={pathname === '/saved-intents'}>
          <GradientIcon isActive={pathname === '/saved-intents'}>
            <Star className="w-5 h-5" />
          </GradientIcon>
          {isExpanded && <span className="font-medium">Saved Intents</span>}
        </NavLink>

        <NavLink href="/recent" isExpanded={isExpanded} isActive={pathname === '/recent'}>
          <GradientIcon isActive={pathname === '/recent'}>
            <Clock className="w-5 h-5" />
          </GradientIcon>
          {isExpanded && <span className="font-medium">Recent</span>}
        </NavLink>

        {/* Recent Items */}
        {isExpanded && (
          <div className="pt-4 space-y-1">
            <div className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider">Recent</div>
            <div className="space-y-1">
              <div className="flex items-center px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span className="truncate">My move to Rio de Janeiro</span>
              </div>
              <div className="flex items-center px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span className="truncate">Setting up in Rio: apartment, community, work</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="mt-auto">
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center w-full h-12 rounded-lg transition-colors duration-200 text-white/60 hover:bg-white/5 hover:text-white",
            !isExpanded && "justify-center"
          )}
        >
          <div className={cn(
            "flex items-center",
            isExpanded ? "px-4 gap-3" : "justify-center w-full"
          )}>
            <GradientIcon>
              <LogOut className="w-5 h-5" />
            </GradientIcon>
            {isExpanded && <span className="font-medium">Logout</span>}
          </div>
        </button>
      </div>
    </div>
  );
}

export default function CollapsibleNavigationSidebar() {
  return (
    <CollapsibleSidebar side="left">
      <NavigationSidebar />
    </CollapsibleSidebar>
  );
}