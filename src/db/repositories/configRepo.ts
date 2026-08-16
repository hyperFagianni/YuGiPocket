import { getDb } from '@/db/client';
import { CONFIG_KEYS } from '@/db/schema';

export async function getConfigValue(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_config WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setConfigValue(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO app_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export async function getLastPackOpenedAt(): Promise<number | null> {
  const value = await getConfigValue(CONFIG_KEYS.lastPackOpenedAt);
  return value ? Number(value) : null;
}

export async function setLastPackOpenedAt(timestamp: number): Promise<void> {
  await setConfigValue(CONFIG_KEYS.lastPackOpenedAt, String(timestamp));
}

export async function getYgoDbVersion(): Promise<string | null> {
  return getConfigValue(CONFIG_KEYS.ygoDbVersion);
}

export async function setYgoDbVersion(version: string): Promise<void> {
  await setConfigValue(CONFIG_KEYS.ygoDbVersion, version);
}

export async function getSeededSetIds(): Promise<string[]> {
  const value = await getConfigValue(CONFIG_KEYS.seededSetIds);
  return value ? (JSON.parse(value) as string[]) : [];
}

export async function markSetSeeded(setId: string): Promise<void> {
  const existing = await getSeededSetIds();
  if (!existing.includes(setId)) {
    await setConfigValue(CONFIG_KEYS.seededSetIds, JSON.stringify([...existing, setId]));
  }
}
