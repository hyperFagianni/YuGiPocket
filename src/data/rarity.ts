import type { RarityTier } from '@/types/domain';

export const RARITY_ORDER: RarityTier[] = ['common', 'rare', 'superRare', 'ultraRare', 'secretRare'];

export const RARITY_LABELS: Record<RarityTier, string> = {
  common: 'Comune',
  rare: 'Rara',
  superRare: 'Super Rara',
  ultraRare: 'Ultra Rara',
  secretRare: 'Rara Segreta',
};

export const RARITY_COLORS: Record<RarityTier, string> = {
  common: '#9AA1AC',
  rare: '#4F8CFF',
  superRare: '#3FD0C9',
  ultraRare: '#F5A623',
  secretRare: '#C96BFF',
};

/**
 * Maps YGOPRODeck's raw `set_rarity` strings (as seen in card_sets entries) to our
 * internal rarity tiers. Returns null for rarities we deliberately don't simulate
 * (e.g. Starlight Rare — see rotd.ts sourceNote) so callers can skip that printing.
 */
const RAW_RARITY_MAP: Record<string, RarityTier> = {
  common: 'common',
  'short print': 'common',
  'super short print': 'common',
  rare: 'rare',
  'super rare': 'superRare',
  'ultra rare': 'ultraRare',
  'secret rare': 'secretRare',
};

export function normalizeRarity(rawSetRarity: string): RarityTier | null {
  const key = rawSetRarity.trim().toLowerCase();
  return RAW_RARITY_MAP[key] ?? null;
}

export function sortByRarity<T extends { rarity: RarityTier }>(items: T[]): T[] {
  return [...items].sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
}
