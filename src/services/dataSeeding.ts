import { SET_CONFIGS } from '@/data/sets';
import { upsertCardSetEntries, upsertCards } from '@/db/repositories/cardsRepo';
import { getSeededSetIds, markSetSeeded, setYgoDbVersion } from '@/db/repositories/configRepo';
import { fetchDbVersion, fetchSetData } from './ygoprodeck';

export interface SeedProgress {
  setId: string;
  displayName: string;
  status: 'pending' | 'loading' | 'done' | 'error';
  error?: string;
}

/**
 * Populates the local SQLite cache for any configured set that hasn't been seeded
 * yet. Runs once on first launch (and again for any newly-added set config in a
 * future update) — after that the app works fully offline from the local cache,
 * per the "no network except to populate the cache" constraint.
 */
export async function seedMissingSets(onProgress?: (progress: SeedProgress[]) => void): Promise<void> {
  const seededSetIds = await getSeededSetIds();
  const progress: SeedProgress[] = SET_CONFIGS.map((s) => ({
    setId: s.setId,
    displayName: s.displayName,
    status: seededSetIds.includes(s.setId) ? 'done' : 'pending',
  }));
  onProgress?.([...progress]);

  const setsToSeed = SET_CONFIGS.filter((s) => !seededSetIds.includes(s.setId));
  if (setsToSeed.length === 0) return;

  const dbVersion = await fetchDbVersion();
  if (dbVersion) {
    await setYgoDbVersion(dbVersion);
  }

  for (const config of setsToSeed) {
    const entry = progress.find((p) => p.setId === config.setId);
    if (!entry) continue;
    entry.status = 'loading';
    onProgress?.([...progress]);
    try {
      const { cards, cardSetEntries } = await fetchSetData(config);
      await upsertCards(cards);
      await upsertCardSetEntries(cardSetEntries);
      await markSetSeeded(config.setId);
      entry.status = 'done';
    } catch (err) {
      entry.status = 'error';
      entry.error = err instanceof Error ? err.message : String(err);
    }
    onProgress?.([...progress]);
  }
}
