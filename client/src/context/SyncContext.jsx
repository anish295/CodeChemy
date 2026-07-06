import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const SyncContext = createContext();

export function useSync() {
  return useContext(SyncContext);
}

export function SyncProvider({ children }) {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Sync state between tabs and reloads
  useEffect(() => {
    const savedCooldown = localStorage.getItem('syncCooldownEnd');
    if (savedCooldown) {
      const remaining = Math.floor((parseInt(savedCooldown) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldownRemaining(remaining);
      } else {
        localStorage.removeItem('syncCooldownEnd');
      }
    }
  }, []);

  useEffect(() => {
    let timer;
    if (cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            localStorage.removeItem('syncCooldownEnd');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const triggerSync = async () => {
    if (syncing || cooldownRemaining > 0 || !user?.leetcodeUsername) return;
    
    setSyncing(true);
    try {
      await api.post('/user/sync');
      // Set 2 minute cooldown
      setCooldownRemaining(120);
      localStorage.setItem('syncCooldownEnd', (Date.now() + 120000).toString());
      return { success: true };
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, error };
    } finally {
      setSyncing(false);
    }
  };

  const value = {
    syncing,
    cooldownRemaining,
    triggerSync
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}
