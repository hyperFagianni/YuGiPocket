import type { DrawnCard, RarityTier, RarityWeights, SetConfig } from '@/types/domain';

export type RandomFn = () => number;

/**
 * Picks a single rarity tier from a weight map. Weights don't need to sum to 1 —
 * they're normalized against their own total, so callers can use any consistent scale.
 */
export function pickWeightedRarity(weights: RarityWeights, rand: RandomFn = Math.random): RarityTier {
  const entries = Object.entries(weights) as [RarityTier, number][];
  if (entries.length === 0) {
    throw new Error('pickWeightedRarity: weights object is empty');
  }
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) {
    throw new Error('pickWeightedRarity: weights must sum to a positive number');
  }
  let roll = rand() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return rarity;
    }
  }
  // Floating point safety net: fall back to the last entry instead of returning undefined.
  return entries[entries.length - 1][0];
}

/**
 * Simulates the rarity of every card slot in one pack for a given set: the "filler"
 * slots are always common, and the `hitSlots` remaining slots are drawn from
 * `hitSlotOdds`. This mirrors how physical Yu-Gi-Oh packs are actually structured
 * (a fixed number of guaranteed rare-or-better slots), rather than treating every
 * card in the pack as an independent draw across all rarities.
 */
export function drawPackRarities(config: SetConfig, rand: RandomFn = Math.random): RarityTier[] {
  const commonSlots = config.cardsPerPack - config.hitSlots;
  const slots: RarityTier[] = new Array(commonSlots).fill('common');
  for (let i = 0; i < config.hitSlots; i++) {
    slots.push(pickWeightedRarity(config.hitSlotOdds, rand));
  }
  return slots;
}

export type CardPoolByRarity = Partial<Record<RarityTier, number[]>>;

/**
 * Draws a full pack of cards: first the rarity of each slot (see drawPackRarities),
 * then a uniformly random card id from that rarity's pool for this set.
 */
export function openPack(config: SetConfig, pool: CardPoolByRarity, rand: RandomFn = Math.random): DrawnCard[] {
  const rarities = drawPackRarities(config, rand);
  return rarities.map((rarity) => {
    const candidates = pool[rarity];
    if (!candidates || candidates.length === 0) {
      throw new Error(`Nessuna carta in cache locale per la rarita "${rarity}" del set "${config.setId}"`);
    }
    const index = Math.floor(rand() * candidates.length);
    return { cardId: candidates[index], rarity };
  });
}
