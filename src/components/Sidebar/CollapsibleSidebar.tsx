import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { cn } from '@/lib/utils';
import { appState, toggleMobileMenu } from '@/lib/store';

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  side: 'left' | 'right';
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
}

export default function CollapsibleSidebar({ children, side }: CollapsibleSidebarProps) {
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const { isMobileMenuOpen } = useStore(appState);
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    // Mobile behavior: controlled by global state, appears as an overlay
    if (side === 'right') {
      return null; // Don't render right sidebar on mobile for now
    }
    
    return (
      <>
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={toggleMobileMenu}
          />
        )}
        <div
          className={cn(
            'fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out',
            'w-72 p-4 glass-morphism-dark',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="h-full overflow-y-auto overflow-x-hidden">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, { isExpanded: true } as React.Attributes & { isExpanded: boolean });
              }
              return child;
            })}
          </div>
        </div>
      </>
    );
  }

  // Desktop behavior: controlled by hover
  const isExpanded = isHoverExpanded;
  const sidebarClasses = cn(
    'fixed top-0 h-full z-40 transition-all duration-300 ease-in-out',
    'pt-28 pb-8', // Padding to avoid header and bottom edge
    'glass-morphism-dark',
    side === 'left' ? 'left-0' : 'right-0',
    isExpanded ? 'w-72' : 'w-20'
  );

  return (
    <div
      className={sidebarClasses}
      onMouseEnter={() => setIsHoverExpanded(true)}
      onMouseLeave={() => setIsHoverExpanded(false)}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { isExpanded } as React.Attributes & { isExpanded: boolean });
          }
          return child;
        })}
      </div>
    </div>
  );
} 