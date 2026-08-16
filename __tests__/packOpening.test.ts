import { lobConfig, mrdConfig, rotdConfig } from '@/data/sets';
import { drawPackRarities, openPack, pickWeightedRarity } from '@/services/packOpening';
import type { CardPoolByRarity } from '@/services/packOpening';
import type { RarityTier, SetConfig } from '@/types/domain';

// Deterministic seeded PRNG so distribution tests are reproducible.
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALL_SETS: SetConfig[] = [lobConfig, mrdConfig, rotdConfig];
const TOLERANCE = 0.02; // absolute probability tolerance for large-sample checks
const SAMPLE_SIZE = 200_000;

describe('pickWeightedRarity', () => {
  it('throws on an empty weight map', () => {
    expect(() => pickWeightedRarity({})).toThrow();
  });

  it('throws when weights sum to zero', () => {
    expect(() => pickWeightedRarity({ common: 0, rare: 0 })).toThrow();
  });

  it('always returns the only tier when it has all the weight', () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      expect(pickWeightedRarity({ ultraRare: 1 }, rand)).toBe('ultraRare');
    }
  });

  it('converges to the configured probabilities over a large sample', () => {
    const weights = { rare: 0.6, superRare: 0.3, ultraRare: 0.1 };
    const rand = mulberry32(1234);
    const counts: Record<string, number> = { rare: 0, superRare: 0, ultraRare: 0 };
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      counts[pickWeightedRarity(weights, rand)]++;
    }
    for (const [rarity, weight] of Object.entries(weights)) {
      expect(counts[rarity] / SAMPLE_SIZE).toBeCloseTo(weight, 1);
    }
  });
});

describe('drawPackRarities', () => {
  it.each(ALL_SETS)('$setId: always returns cardsPerPack slots', (config) => {
    const rand = mulberry32(7);
    const rarities = drawPackRarities(config, rand);
    expect(rarities).toHaveLength(config.cardsPerPack);
  });

  it.each(ALL_SETS)('$setId: fills exactly (cardsPerPack - hitSlots) common slots every time', (config) => {
    const rand = mulberry32(99);
    for (let i = 0; i < 500; i++) {
      const rarities = drawPackRarities(config, rand);
      const commonCount = rarities.filter((r) => r === 'common').length;
      expect(commonCount).toBe(config.cardsPerPack - config.hitSlots);
    }
  });

  it.each(ALL_SETS)('$setId: hit slot(s) only ever draw a rarity present in hitSlotOdds', (config) => {
    const rand = mulberry32(11);
    const allowed = new Set(Object.keys(config.hitSlotOdds));
    for (let i = 0; i < 500; i++) {
      const rarities = drawPackRarities(config, rand);
      const nonCommon = rarities.filter((r) => r !== 'common');
      expect(nonCommon).toHaveLength(config.hitSlots);
      for (const rarity of nonCommon) {
        expect(allowed.has(rarity)).toBe(true);
      }
    }
  });

  it.each(ALL_SETS)(
    '$setId: observed hit-slot rarity frequency converges to hitSlotOdds within tolerance',
    (config) => {
      const rand = mulberry32(2026);
      const counts: Partial<Record<RarityTier, number>> = {};
      let hitSlotTotal = 0;
      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const rarities = drawPackRarities(config, rand);
        for (const rarity of rarities) {
          if (rarity !== 'common') {
            counts[rarity] = (counts[rarity] ?? 0) + 1;
            hitSlotTotal++;
          }
        }
      }
      for (const [rarity, expectedProbability] of Object.entries(config.hitSlotOdds)) {
        const observed = (counts[rarity as RarityTier] ?? 0) / hitSlotTotal;
        expect(Math.abs(observed - expectedProbability)).toBeLessThan(TOLERANCE);
      }
    },
  );
});

describe('openPack', () => {
  const fakePool: CardPoolByRarity = {
    common: [1, 2, 3],
    rare: [4, 5],
    superRare: [6],
    ultraRare: [7],
    secretRare: [8],
  };

  it('returns one drawn card per pack slot, each id coming from the matching rarity pool', () => {
    const rand = mulberry32(5);
    for (const config of ALL_SETS) {
      const drawn = openPack(config, fakePool, rand);
      expect(drawn).toHaveLength(config.cardsPerPack);
      for (const { cardId, rarity } of drawn) {
        expect(fakePool[rarity]).toContain(cardId);
      }
    }
  });

  it('throws a descriptive error when the pool is missing cards for a required rarity', () => {
    const rand = mulberry32(1);
    const emptyPool: CardPoolByRarity = { common: [1] };
    expect(() => openPack(lobConfig, emptyPool, rand)).toThrow(/nessuna carta/i);
  });
});
