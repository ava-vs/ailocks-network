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

export const appState = atom({
  activeMode: 'researcher' as AIMode,
  language: 'en' as Language,
  userLocation: { country: 'US', city: 'New York', timezone: 'America/New_York', isDefault: true } as UserLocation,
  isClientInitialized: false,
  isMobileMenuOpen: false, // For controlling the mobile sidebar
});

// Getter for client initialization status
export const isClientInitialized = atom(false);

// Actions to update the store
export function initializeClient() {
  const currentState = appState.get();
  if (!currentState.isClientInitialized) {
    appState.set({ ...currentState, isClientInitialized: true });
    isClientInitialized.set(true);
    //
  }
}

export function setMode(mode: AIMode) {
  appState.set({ ...appState.get(), activeMode: mode });
}

export function setLanguage(language: Language) {
  const currentLanguage = appState.get().language;
  if (currentLanguage !== language) {
    appState.set({ ...appState.get(), language });
    if (typeof window !== 'undefined') {
      localStorage.setItem('ailocks-language', language);
    }
  }
}

export function setLocation(location: UserLocation) {
  appState.set({ ...appState.get(), userLocation: location });
}

export function toggleMobileMenu() {
  const state = appState.get();
  appState.set({ ...state, isMobileMenuOpen: !state.isMobileMenuOpen });
}

// Legacy stores - can be phased out
export const currentLanguage = atom<Language>('en');
export const userLocation = atom<UserLocation>({ country: 'US', city: 'New York', timezone: 'America/New_York', isDefault: true });

// Sync legacy stores with the main appState
appState.subscribe(state => {
  currentLanguage.set(state.language);
  userLocation.set(state.userLocation);
});

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