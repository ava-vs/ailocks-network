import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { setLocation } from '../lib/store';

export interface DemoUser {
  id: string; 
  name: string;
  email: string;
  avatar: string;
  country: string;
  city: string;
  timezone: string;
}

let isInitialized = false;

// defaul tUser
const defaultUser: DemoUser = {
  id: 'loading',
  name: 'Loading...',
  email: 'loading@example.com',
  avatar: '/api/placeholder/120/120?text=L',
  country: 'BR',
  city: 'Rio de Janeiro',
  timezone: 'America/Sao_Paulo'
};

const demoUsersAtom = atom<{ lirea: DemoUser | null, marco: DemoUser | null }>({ lirea: null, marco: null });
const currentUserAtom = atom<DemoUser>(defaultUser);

async function initializeUserSession() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    console.log('🔄 Initializing user session...');
    const response = await fetch('/.netlify/functions/get-demo-users');
    if (!response.ok) throw new Error('Failed to fetch demo users');
    
    const data = await response.json();
    if (!data.success || !data.users || data.users.length < 2) {
      throw new Error('Invalid demo user data');
    }

    const lireaFromDB = data.users.find((u: any) => u.email.startsWith('lirea'));
    const marcoFromDB = data.users.find((u: any) => u.email.startsWith('marco'));

    if (!lireaFromDB || !marcoFromDB) throw new Error('Lirea or Marco not found in DB');

    const loadedDemoUsers = {
      lirea: { ...lireaFromDB, avatar: '/images/avatars/lirea.png' },
      marco: { ...marcoFromDB, avatar: '/images/avatars/marco.png' }
    };
    demoUsersAtom.set(loadedDemoUsers);
    console.log('✅ Demo users loaded and stored:', loadedDemoUsers);

    const savedUser = localStorage.getItem('ailocks-currentUser');
    let userToSet = loadedDemoUsers.lirea; // Default to Lirea
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.name === 'Marco') {
        userToSet = loadedDemoUsers.marco;
      }
    }
    
    currentUserAtom.set(userToSet);
    setLocation({
      country: userToSet.country,
      city: userToSet.city,
      timezone: userToSet.timezone,
      isDefault: false
    });
    console.log('✅ User session initialized. Current user:', userToSet.name);

    if (userToSet.name === 'Lirea') {
      localStorage.setItem('userPlan', 'pro');
    }

  } catch (error) {
    console.warn('⚠️ DB connection failed, using mock user data as fallback:', error);

    const mockLirea: DemoUser = {
      id: '6f3f3134-dd24-4665-b6cd-f9caf57d859f',
      name: 'Lirea',
      email: 'lirea.designer@example.com',
      avatar: '/images/avatars/lirea.png',
      country: 'BR',
      city: 'Rio de Janeiro',
      timezone: 'America/Sao_Paulo'
    };
    const mockMarco: DemoUser = {
      id: '6376f30a-1ee4-4aa9-bdde-dd9ac0be6f24',
      name: 'Marco',
      email: 'marco.manager@fintechrio.com',
      avatar: '/images/avatars/marco.png',
      country: 'BR',
      city: 'Rio de Janeiro',
      timezone: 'America/Sao_Paulo'
    };
    const mockDemoUsers = { lirea: mockLirea, marco: mockMarco };
    
    demoUsersAtom.set(mockDemoUsers);
    console.log('✅ Mock users created due to DB failure:', mockDemoUsers);

    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('ailocks-currentUser') : null;
    let userToSet = mockLirea;
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.name === 'Marco') {
        userToSet = mockMarco;
      }
    }
    
    currentUserAtom.set(userToSet);
    setLocation({
      country: userToSet.country,
      city: userToSet.city,
      timezone: userToSet.timezone,
      isDefault: false
    });
    console.log('✅ User session initialized with mock data. Current user:', userToSet.name);

    if (userToSet.name === 'Lirea') {
      localStorage.setItem('userPlan', 'pro');
    }
  }
}

// Initialize session once when the module is loaded
// initializeUserSession(); // <-- REMOVED: This causes SSR errors. Initialization will be moved to the hook.

export function useUserSession() {
  const user = useStore(currentUserAtom);
  const allDemoUsers = useStore(demoUsersAtom);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Moved initialization logic here to ensure it runs only on the client
    if (!isInitialized) {
      initializeUserSession();
    }
    setIsHydrated(true);
  }, []);

  const setUser = (newUser: DemoUser) => {
    currentUserAtom.set(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ailocks-currentUser', JSON.stringify(newUser));
      setLocation({
        country: newUser.country,
        city: newUser.city,
        timezone: newUser.timezone,
        isDefault: false
      });
      window.dispatchEvent(new CustomEvent('userChanged', { detail: newUser }));
    }
  };

  const switchUser = () => {
    const { lirea, marco } = demoUsersAtom.get();
    if (!lirea || !marco) return;
    const newUser = user.name === 'Lirea' ? marco : lirea;
    setUser(newUser);
  };

  return { 
    currentUser: user, 
    setUser, 
    switchUser,
    demoUsers: allDemoUsers,
    isLirea: user.name === 'Lirea',
    isMarco: user.name === 'Marco',
    isHydrated,
    demoUsersLoaded: !!allDemoUsers.lirea,
    isLoading: user.id === 'loading'
  };
}
