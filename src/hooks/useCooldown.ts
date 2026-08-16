import { useCallback, useEffect, useState } from 'react';

import { getLastPackOpenedAt, setLastPackOpenedAt } from '@/db/repositories/configRepo';
import { canOpenPack, formatCountdown, msUntilNextPack } from '@/services/cooldown';

export function useCooldown() {
  const [lastOpenedAt, setLastOpenedAtState] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    getLastPackOpenedAt().then((value) => {
      if (mounted) {
        setLastOpenedAtState(value);
        setLoaded(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const markOpened = useCallback(async () => {
    const timestamp = Date.now();
    await setLastPackOpenedAt(timestamp);
    setLastOpenedAtState(timestamp);
    setNow(timestamp);
  }, []);

  const remainingMs = msUntilNextPack(lastOpenedAt, now);
  const canOpen = loaded && canOpenPack(lastOpenedAt, now);

  return {
    loaded,
    canOpen,
    remainingMs,
    countdownLabel: formatCountdown(remainingMs),
    markOpened,
  };
}
