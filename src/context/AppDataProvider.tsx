import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getDb } from '@/db/client';
import type { SeedProgress } from '@/services/dataSeeding';
import { seedMissingSets } from '@/services/dataSeeding';

type AppDataStatus = 'initializing' | 'ready' | 'error';

interface AppDataState {
  status: AppDataStatus;
  seedProgress: SeedProgress[];
  fatalError: string | null;
  retry: () => void;
}

const AppDataContext = createContext<AppDataState | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AppDataStatus>('initializing');
  const [seedProgress, setSeedProgress] = useState<SeedProgress[]>([]);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus('initializing');
      setFatalError(null);
      try {
        await getDb();
        await seedMissingSets((progress) => {
          if (!cancelled) setSeedProgress(progress);
        });
        if (!cancelled) setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setFatalError(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const retry = useCallback(() => setRetryToken((t) => t + 1), []);

  return (
    <AppDataContext.Provider value={{ status, seedProgress, fatalError, retry }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataState {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return ctx;
}
