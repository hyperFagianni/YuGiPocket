import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAppData } from '@/context/AppDataProvider';
import { SET_CONFIGS } from '@/data/sets';
import { useCooldown } from '@/hooks/useCooldown';

export default function HomeScreen() {
  const { seedProgress, retry } = useAppData();
  const cooldown = useCooldown();

  const availableSets = useMemo(
    () => SET_CONFIGS.filter((s) => seedProgress.find((p) => p.setId === s.setId)?.status === 'done'),
    [seedProgress],
  );
  const anyPending = seedProgress.some((p) => p.status === 'loading' || p.status === 'pending');
  const anyError = seedProgress.some((p) => p.status === 'error');

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const effectiveSetId = selectedSetId ?? availableSets[0]?.setId ?? null;

  function handleOpenPack() {
    if (!effectiveSetId || !cooldown.canOpen) return;
    cooldown.markOpened();
    router.push({ pathname: '/opening', params: { setId: effectiveSetId } });
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>YuGiPocket</Text>
      <Text style={styles.subtitle}>Apri una busta gratuita ogni 12 ore e completa la tua collezione.</Text>

      <Text style={styles.sectionLabel}>Espansione</Text>
      {availableSets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {anyPending
              ? 'Download dei dati delle carte in corso…'
              : 'Nessuna espansione disponibile. Controlla la connessione e riprova.'}
          </Text>
          {anyError && !anyPending && <PrimaryButton label="Riprova" onPress={retry} variant="secondary" />}
        </View>
      ) : (
        <FlatList
          data={availableSets}
          keyExtractor={(item) => item.setId}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.setList}
          renderItem={({ item }) => {
            const selected = item.setId === effectiveSetId;
            return (
              <Pressable
                onPress={() => setSelectedSetId(item.setId)}
                style={[styles.setCard, selected && styles.setCardSelected]}>
                <Text style={[styles.setName, selected && styles.setNameSelected]}>{item.displayName}</Text>
                <Text style={styles.setYear}>{item.releaseYear}</Text>
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.openSection}>
        <PrimaryButton
          label={cooldown.canOpen ? 'Apri busta gratis' : `Prossima busta tra ${cooldown.countdownLabel}`}
          onPress={handleOpenPack}
          disabled={!cooldown.canOpen || !effectiveSetId || !cooldown.loaded}
        />
        <Text style={styles.disclaimer}>Una busta gratuita ogni 12 ore. Nessun acquisto, nessuna pubblicità.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: Spacing.lg,
  },
  subtitle: {
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  setList: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  setCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    width: 180,
  },
  setCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  setName: {
    color: Colors.text,
    fontWeight: '700',
  },
  setNameSelected: {
    color: Colors.primary,
  },
  setYear: {
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textMuted,
  },
  openSection: {
    marginTop: 'auto',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
