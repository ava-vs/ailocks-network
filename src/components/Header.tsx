import React from 'react';
import { Menu } from 'lucide-react';
import AilockHeaderWidget from '@/components/Ailock/AilockHeaderWidget';
import UserHeaderInfo from '@/components/Header/UserHeaderInfo';
import { toggleMobileMenu } from '@/lib/store';

export default function Header() {
  return (
    <header className="glass-morphism-dark fixed top-4 left-4 right-4 z-50 h-20 px-4 md:px-6 rounded-2xl">
      <div className="flex items-center justify-between w-full h-full">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
            <img 
              src="/images/ailock-logo.png" 
              alt="Ailock Logo" 
              className="w-10 h-10 rounded-xl"
            />
          </div>
          <div>
            <span className="font-bold text-xl text-white">Ailocks</span>
            <div className="text-sm text-white/60 font-medium">Ai2Ai Network</div>
          </div>
        </div>

        {/* Center: Ailock Widget - hidden on mobile */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <AilockHeaderWidget />
        </div>

        {/* Right Section: User Info & Upgrade - hidden on mobile */}
        <div className="hidden md:flex items-center">
          <UserHeaderInfo />
        </div>

        {/* Mobile Menu Button - shows on mobile */}
        <div className="md:hidden">
          <button 
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}