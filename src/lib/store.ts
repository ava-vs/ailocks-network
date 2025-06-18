import { atom } from 'nanostores';

export type AIMode = 'researcher' | 'creator' | 'analyst';
export type Language = 'en' | 'ru';

export interface UserLocation {
  country: string;
  city: string;
  timezone: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

// Global state atoms - Initialize with safe defaults for SSR
export const currentMode = atom<AIMode>('researcher');
export const currentLanguage = atom<'en' | 'ru'>('en');
export const userLocation = atom<UserLocation>({
  country: 'US',
  city: 'New York',
  timezone: 'America/New_York',
  isDefault: true
});

// Client-side initialization flag
export const isClientInitialized = atom<boolean>(false);

// Initialize from server-detected data only on client
if (typeof window !== 'undefined') {
  // Client-side initialization
  const initializeFromServer = () => {
    // Mark as initialized
    isClientInitialized.set(true);
    
    // Initialize language from server meta tag first (for hydration consistency)
    const detectedLang = document.querySelector('meta[name="detected-language"]')?.getAttribute('content');
    if (detectedLang && ['en', 'ru'].includes(detectedLang)) {
      currentLanguage.set(detectedLang as Language);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'ru') {
        currentLanguage.set('ru');
      } else {
        currentLanguage.set('en');
      }
    }

    // Initialize location from server data
    const userLocationMeta = document.querySelector('meta[name="user-location"]')?.getAttribute('content');
    if (userLocationMeta) {
      try {
        const locationData = JSON.parse(userLocationMeta);
        userLocation.set(locationData);
      } catch (error) {
        console.warn('Failed to parse user location from meta tag:', error);
      }
    }
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFromServer);
  } else {
    initializeFromServer();
  }
}

// Actions
export function setMode(mode: AIMode) {
  currentMode.set(mode);
}

export function setLanguage(language: Language) {
  currentLanguage.set(language);
  // Save to localStorage for persistence (only on client)
  if (typeof window !== 'undefined') {
    localStorage.setItem('ailocks-language', language);
  }
}

export function setLocation(location: UserLocation) {
  userLocation.set({
    ...location,
    isDefault: false // Mark as user-overridden
  });
  
  // Save to localStorage for persistence (only on client)
  if (typeof window !== 'undefined') {
    localStorage.setItem('ailocks-location', JSON.stringify(location));
  }
}