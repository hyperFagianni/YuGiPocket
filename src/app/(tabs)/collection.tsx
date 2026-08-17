import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { CardTile } from '@/components/CardTile';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RARITY_LABELS, RARITY_ORDER } from '@/data/rarity';
import { SET_CONFIG_BY_ID, SET_CONFIGS } from '@/data/sets';
import { useAppData } from '@/context/AppDataProvider';
import { useCollection } from '@/hooks/useCollection';
import type { RarityTier } from '@/types/domain';

export default function CollectionScreen() {
  const { seedProgress } = useAppData();
  const seededSets = SET_CONFIGS.filter((s) => seedProgress.find((p) => p.setId === s.setId)?.status === 'done');

  const [setId, setSetId] = useState(SET_CONFIGS[0].setId);
  const [rarity, setRarity] = useState<RarityTier | null>(null);
  const [onlyOwned, setOnlyOwned] = useState(false);

  const activeConfig = SET_CONFIG_BY_ID[setId];
  const statsQuery = useCollection({ setId });
  const gridQuery = useCollection({ setId, rarity: rarity ?? undefined, onlyOwned });

  useFocusEffect(
    useCallback(() => {
      statsQuery.refetch();
      gridQuery.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statsQuery.refetch, gridQuery.refetch]),
  );

  const ownedCount = statsQuery.items.filter((i) => i.quantity > 0).length;
  const totalCount = statsQuery.items.length;
  const completionPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  return (
    <ScreenContainer>
      <Text variant="heading" style={styles.title}>
        Collezione
      </Text>

      <View style={styles.setChipRow}>
        {SET_CONFIGS.map((s) => {
          const seeded = seededSets.some((seeded) => seeded.setId === s.setId);
          return (
            <Pressable
              key={s.setId}
              disabled={!seeded}
              onPress={() => setSetId(s.setId)}
              style={[styles.setChip, setId === s.setId && styles.setChipSelected, !seeded && styles.setChipDisabled]}>
              <Text style={[styles.setChipText, setId === s.setId && styles.setChipTextSelected]}>{s.setCode}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeConfig && (
        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>
            {activeConfig.displayName}: {ownedCount}/{totalCount} carte ({completionPct}%)
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setRarity(null)}
          style={[styles.rarityChip, rarity === null && styles.rarityChipSelected]}>
          <Text style={[styles.rarityChipText, rarity === null && styles.rarityChipTextSelected]}>Tutte</Text>
        </Pressable>
        {(activeConfig?.rarityTiers ?? RARITY_ORDER).map((r) => (
          <Pressable key={r} onPress={() => setRarity(r)} style={[styles.rarityChip, rarity === r && styles.rarityChipSelected]}>
            <Text style={[styles.rarityChipText, rarity === r && styles.rarityChipTextSelected]}>{RARITY_LABELS[r]}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.ownedToggle} onPress={() => setOnlyOwned((v) => !v)}>
        <View style={[styles.checkbox, onlyOwned && styles.checkboxChecked]} />
        <Text style={styles.ownedToggleText}>Solo carte possedute</Text>
      </Pressable>

      <FlatList
        data={gridQuery.items}
        keyExtractor={(item) => `${item.id}-${item.setId}`}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => <CardTile item={item} />}
        ListEmptyComponent={
          !gridQuery.loading ? <Text style={styles.emptyText}>Nessuna carta corrisponde ai filtri selezionati.</Text> : null
        }
        contentContainerStyle={styles.gridContent}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  setChipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  setChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  setChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  setChipDisabled: {
    opacity: 0.35,
  },
  setChipText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  setChipTextSelected: {
    color: Colors.primary,
  },
  progressBox: {
    marginBottom: Spacing.md,
  },
  progressLabel: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  rarityChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  rarityChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  rarityChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  rarityChipTextSelected: {
    color: Colors.primary,
  },
  ownedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ownedToggleText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridContent: {
    paddingBottom: Spacing.xxl,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
