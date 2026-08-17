import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { RARITY_COLORS, RARITY_LABELS } from '@/data/rarity';
import { Radius, Spacing } from '@/constants/theme';
import type { RarityTier } from '@/types/domain';

/** Numero di punte della gemma stilizzata che precede il badge, crescente con la rarità. */
const GEM_POINTS: Record<RarityTier, number> = {
  common: 3,
  rare: 4,
  superRare: 5,
  ultraRare: 6,
  secretRare: 8,
};

function Gem({ color, points }: { color: string; points: number }) {
  return (
    <View style={styles.gemWrapper}>
      {Array.from({ length: points }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.gemSpike,
            {
              backgroundColor: color,
              transform: [{ rotate: `${(360 / points) * i}deg` }],
            },
          ]}
        />
      ))}
      <View style={[styles.gemCore, { backgroundColor: color }]} />
    </View>
  );
}

export function RarityBadge({ rarity }: { rarity: RarityTier }) {
  const color = RARITY_COLORS[rarity];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Gem color={color} points={GEM_POINTS[rarity]} />
      <Text style={[styles.label, { color }]}>{RARITY_LABELS[rarity]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  gemWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gemSpike: {
    position: 'absolute',
    width: 2,
    height: 10,
    borderRadius: 1,
  },
  gemCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
