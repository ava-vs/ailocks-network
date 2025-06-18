import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { setLocation } from '../lib/store';

export interface DemoUser {
  id: string; // Реальный UUID из базы данных
  name: string;
  email: string;
  avatar: string;
  country: string;
  city: string;
  timezone: string;
}

// Пустые демо-пользователи, которые будут загружены из БД
let demoUsers: { lirea: DemoUser | null, marco: DemoUser | null } = {
  lirea: null,
  marco: null
};

// Дефолтный пользователь (будет заменен на реального после загрузки)
const defaultUser: DemoUser = {
  id: 'loading',
  name: 'Loading...',
  email: 'loading@example.com',
  avatar: '/api/placeholder/120/120?text=L',
  country: 'BR',
  city: 'Rio de Janeiro',
  timezone: 'America/Sao_Paulo'
};

const currentUserAtom = atom<DemoUser>(defaultUser);

// Функция для загрузки реальных демо-пользователей из БД
async function loadDemoUsers(): Promise<boolean> {
  try {
    console.log('🔄 Loading demo users from database...');
    const response = await fetch('/.netlify/functions/get-demo-users');
    
    if (!response.ok) {
      console.warn('⚠️ Failed to load demo users from database');
      return false;
    }
    
    const data = await response.json();
    
    if (data.success && data.users && data.users.length >= 2) {
      console.log('✅ Loaded demo users:', data.users);
      
             // Находим пользователей по email для надежности
       const lireaFromDB = data.users.find((u: any) => 
         u.email === 'lirea.designer@example.com' || u.name === 'Lirea'
       );
       const marcoFromDB = data.users.find((u: any) => 
         u.email === 'marco.manager@fintechrio.com' || u.name === 'Marco'
       );
      
      if (lireaFromDB && marcoFromDB) {
        // Обновляем демо-пользователей реальными данными из БД
        demoUsers.lirea = {
          id: lireaFromDB.id,
          name: lireaFromDB.name,
          email: lireaFromDB.email,
          avatar: '/images/avatars/lirea.png',
          country: lireaFromDB.country,
          city: lireaFromDB.city,
          timezone: lireaFromDB.timezone
        };
        
        demoUsers.marco = {
          id: marcoFromDB.id,
          name: marcoFromDB.name,
          email: marcoFromDB.email,
          avatar: '/images/avatars/marco.png',
          country: marcoFromDB.country,
          city: marcoFromDB.city,
          timezone: marcoFromDB.timezone
        };
        
                 console.log('✅ Demo users loaded successfully:', demoUsers);
         console.log('📋 Real UUIDs:', {
           lirea: demoUsers.lirea.id,
           marco: demoUsers.marco.id
         });
         
         // Устанавливаем Лирею как дефолтного пользователя
         currentUserAtom.set(demoUsers.lirea);
         
         return true;
      }
    }
    
    console.warn('⚠️ Invalid response format or missing users');
    return false;
    
  } catch (error) {
    console.warn('⚠️ Error loading demo users:', error);
    return false;
  }
}

export function useUserSession() {
  const user = useStore(currentUserAtom);
  const [isHydrated, setIsHydrated] = useState(false);
  const [demoUsersLoaded, setDemoUsersLoaded] = useState(false);

  useEffect(() => {
    // Mark as hydrated and then safely access localStorage
    setIsHydrated(true);
    
    // Загружаем демо-пользователей из БД
    loadDemoUsers().then((success) => {
      setDemoUsersLoaded(success);
      
      if (success && demoUsers.lirea && demoUsers.marco) {
        // Only access localStorage after hydration and user loading
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('ailocks-currentUser');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              
              // Validate that the saved user is one of our demo users by name
              if (parsedUser.name === 'Lirea' && demoUsers.lirea) {
                currentUserAtom.set(demoUsers.lirea);
                setLocation({
                  country: demoUsers.lirea.country,
                  city: demoUsers.lirea.city,
                  timezone: demoUsers.lirea.timezone,
                  isDefault: false
                });
              } else if (parsedUser.name === 'Marco' && demoUsers.marco) {
                currentUserAtom.set(demoUsers.marco);
                setLocation({
                  country: demoUsers.marco.country,
                  city: demoUsers.marco.city,
                  timezone: demoUsers.marco.timezone,
                  isDefault: false
                });
              } else {
                // Fallback to Lirea if saved user is invalid
                currentUserAtom.set(demoUsers.lirea);
                setLocation({
                  country: demoUsers.lirea.country,
                  city: demoUsers.lirea.city,
                  timezone: demoUsers.lirea.timezone,
                  isDefault: false
                });
              }
            } catch (error) {
              console.warn('Failed to parse saved user, using Lirea');
              if (demoUsers.lirea) {
                currentUserAtom.set(demoUsers.lirea);
                setLocation({
                  country: demoUsers.lirea.country,
                  city: demoUsers.lirea.city,
                  timezone: demoUsers.lirea.timezone,
                  isDefault: false
                });
              }
            }
          } else {
            // Set initial location for default user (Lirea)
            if (demoUsers.lirea) {
              setLocation({
                country: demoUsers.lirea.country,
                city: demoUsers.lirea.city,
                timezone: demoUsers.lirea.timezone,
                isDefault: false
              });
            }
          }
        }
      } else {
        console.error('❌ Failed to load demo users, app may not work correctly');
      }
    });
  }, []);

  const setUser = (newUser: DemoUser) => {
    currentUserAtom.set(newUser);
    
    // Only access localStorage after hydration
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('ailocks-currentUser', JSON.stringify(newUser));
    }
    
    // Update location when user changes
    setLocation({
      country: newUser.country,
      city: newUser.city,
      timezone: newUser.timezone,
      isDefault: false
    });
    
    // Trigger a custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userChanged', { detail: newUser }));
    }
  };

  const switchUser = () => {
    if (!demoUsers.lirea || !demoUsers.marco) {
      console.warn('Demo users not loaded yet');
      return;
    }
    
    const newUser = user.name === 'Lirea' ? demoUsers.marco : demoUsers.lirea;
    setUser(newUser);
  };

  return { 
    currentUser: user, 
    setUser, 
    switchUser,
    demoUsers,
    isLirea: user.name === 'Lirea',
    isMarco: user.name === 'Marco',
    isHydrated,
    demoUsersLoaded,
    isLoading: user.id === 'loading'
  };
}