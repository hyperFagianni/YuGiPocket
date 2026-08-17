import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CardImage } from '@/components/CardImage';
import { FoilShine } from '@/components/FoilShine';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RarityBadge } from '@/components/RarityBadge';
import { RarityRevealEffect } from '@/components/RarityRevealEffect';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { SET_CONFIG_BY_ID } from '@/data/sets';
import { getCardPoolByRarityForSet, getCardsByIds } from '@/db/repositories/cardsRepo';
import { addCardToCollection } from '@/db/repositories/collectionRepo';
import { openPack } from '@/services/packOpening';
import type { PulledCard } from '@/types/domain';

const FLIP_OUT_MS = 220;
const FLIP_IN_MS = 420;

export default function OpeningScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const config = setId ? SET_CONFIG_BY_ID[setId] : null;

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pulledCards, setPulledCards] = useState<PulledCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const rotateY = useSharedValue(90);

  useEffect(() => {
    if (!config) {
      setStatus('error');
      setErrorMessage('Espansione non valida.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const pool = await getCardPoolByRarityForSet(config.setId);
        const drawn = openPack(config, pool);
        const cardRecords = await getCardsByIds(drawn.map((d) => d.cardId));
        const pulled: PulledCard[] = drawn.map((d) => {
          const card = cardRecords.get(d.cardId);
          if (!card) throw new Error(`Carta ${d.cardId} non trovata in cache locale`);
          return { card, setId: config.setId, rarity: d.rarity };
        });
        const obtainedAt = Date.now();
        for (const pulledCard of pulled) {
          await addCardToCollection(pulledCard.card.id, pulledCard.setId, pulledCard.rarity, obtainedAt);
        }
        if (!cancelled) {
          setPulledCards(pulled);
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // config is derived from a route param that doesn't change within this screen's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ogni volta che la carta corrente cambia (compreso il mount iniziale), la carta si "gira"
  // direttamente a faccia in su: nessun dorso/placeholder intermedio da mostrare.
  useEffect(() => {
    if (status !== 'ready') return;
    setRevealed(false);
    rotateY.value = withTiming(0, { duration: FLIP_IN_MS }, (finished) => {
      if (finished) runOnJS(setRevealed)(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, status]);

  function handleAdvance() {
    if (!revealed || transitioning) return;
    if (currentIndex >= pulledCards.length - 1) return;
    setTransitioning(true);
    rotateY.value = withTiming(90, { duration: FLIP_OUT_MS }, (finished) => {
      if (finished) {
        runOnJS(setCurrentIndex)((i) => i + 1);
        runOnJS(setTransitioning)(false);
      }
    });
  }

  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotateY.value}deg` }],
  }));

  if (status === 'loading') {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Apertura busta…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (status === 'error') {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <PrimaryButton label="Chiudi" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  const current = pulledCards[currentIndex];
  const isLast = currentIndex === pulledCards.length - 1;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.progress}>
          Carta {currentIndex + 1} / {pulledCards.length}
        </Text>
        <Text style={styles.setName}>{config?.displayName}</Text>
      </View>

      <Pressable style={styles.cardArea} onPress={handleAdvance}>
        <Animated.View style={[styles.revealedCard, flipStyle]}>
          <View style={styles.cardImageBox}>
            <FoilShine rarity={current.rarity}>
              <CardImage cardId={current.card.id} remoteUrl={current.card.imageUrl} style={styles.cardImage} />
            </FoilShine>
            {revealed && current.rarity !== 'common' && (
              <View style={styles.effectOverlay} pointerEvents="none">
                <RarityRevealEffect rarity={current.rarity} />
              </View>
            )}
          </View>
          <Text variant="heading" style={styles.cardName}>
            {current.card.name}
          </Text>
          <RarityBadge rarity={current.rarity} />
        </Animated.View>
      </Pressable>

      <View style={styles.footer}>
        {revealed && !isLast && <Text style={styles.tapHint}>Tocca la carta per continuare</Text>}
        {revealed && isLast && <PrimaryButton label="Vai alla collezione" onPress={() => router.replace('/collection')} />}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textMuted,
  },
  errorText: {
    color: Colors.danger,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: 2,
  },
  progress: {
    color: Colors.primary,
    fontWeight: '700',
  },
  setName: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealedCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardImageBox: {
    width: 220,
    height: 320,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
  },
  effectOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.md,
  },
  cardName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  tapHint: {
    color: Colors.textMuted,
    fontSize: 13,
  },
});
