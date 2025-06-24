import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import CollapsibleSidebar from './CollapsibleSidebar';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isExpanded: boolean;
}

const NavLink = ({ href, children, isExpanded }: NavLinkProps) => {
  const [pathname, setPathname] = useState('');
  useEffect(() => {
    // This hook runs only on the client, so window is safe to use.
    setPathname(window.location.pathname);
  }, []);

  const isActive = pathname === href;

  return (
    <a
      href={href}
      className={cn(
        "flex items-center w-full h-12 rounded-lg px-4 transition-colors duration-200",
        isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
        !isExpanded && "justify-center"
      )}
    >
      {children}
    </a>
  );
};

interface NavigationSidebarProps {
  isExpanded?: boolean;
}

function NavigationSidebar({ isExpanded = false }: NavigationSidebarProps) {
  const handleSignOut = () => {
    // Implement sign out logic here
    console.log("Signing out...");
  };

  return (
    <div className="flex flex-col h-full p-4 text-white">
      <nav className="flex-grow space-y-2">
        <NavLink href="/" isExpanded={isExpanded}>
          <Icon name="home" className="h-5 w-5" />
          {isExpanded && <span className="ml-3">Home</span>}
        </NavLink>
        <NavLink href="/my-ailock" isExpanded={isExpanded}>
          <Icon name="ailock" className="h-5 w-5" />
          {isExpanded && <span className="ml-3">My Ailock</span>}
        </NavLink>
        <NavLink href="/query-history" isExpanded={isExpanded}>
          <Icon name="history" className="h-5 w-5" />
          {isExpanded && <span className="ml-3">Query History</span>}
        </NavLink>
        <NavLink href="/saved-intents" isExpanded={isExpanded}>
          <Icon name="bookmark" className="h-5 w-5" />
          {isExpanded && <span className="ml-3">Saved Intents</span>}
        </NavLink>
        <NavLink href="/recent" isExpanded={isExpanded}>
          <Icon name="recent" className="h-5 w-5" />
          {isExpanded && <span className="ml-3">Recent</span>}
        </NavLink>
        {/* The page for API Keys does not exist yet.
        <NavLink href="/api-keys" isExpanded={isExpanded}>
          <Icon name="key" className="h-5 w-5" />
          {isExpanded && <span className="ml-3">API Keys</span>}
        </NavLink> 
        */}
      </nav>
      <div className="mt-auto">
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center w-full h-12 rounded-lg px-4 transition-colors duration-200 text-white/60 hover:bg-white/5 hover:text-white",
            !isExpanded && "justify-center"
          )}
        >
          <Icon name="logout" className="h-5 w-5" />
          {isExpanded && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
}

// Default export wrapped in CollapsibleSidebar
export default function CollapsibleNavigationSidebar() {
  return (
    <CollapsibleSidebar side="left">
      <NavigationSidebar />
    </CollapsibleSidebar>
  );
}