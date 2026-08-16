import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RARITY_COLORS, RARITY_LABELS } from '@/data/rarity';
import { Radius, Spacing } from '@/constants/theme';
import type { RarityTier } from '@/types/domain';

export function RarityBadge({ rarity }: { rarity: RarityTier }) {
  const color = RARITY_COLORS[rarity];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{RARITY_LABELS[rarity]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
