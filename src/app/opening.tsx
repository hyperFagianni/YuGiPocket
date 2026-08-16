import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { CardImage } from '@/components/CardImage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RarityBadge } from '@/components/RarityBadge';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { SET_CONFIG_BY_ID } from '@/data/sets';
import { getCardPoolByRarityForSet, getCardsByIds } from '@/db/repositories/cardsRepo';
import { addCardToCollection } from '@/db/repositories/collectionRepo';
import { openPack } from '@/services/packOpening';
import type { PulledCard } from '@/types/domain';

export default function OpeningScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const config = setId ? SET_CONFIG_BY_ID[setId] : null;

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pulledCards, setPulledCards] = useState<PulledCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

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

  useEffect(() => {
    if (status !== 'ready') return;
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.85);
    setRevealed(false);
  }, [currentIndex, status, fadeAnim, scaleAnim]);

  function handleReveal() {
    if (revealed) {
      if (currentIndex < pulledCards.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
      return;
    }
    setRevealed(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }),
    ]).start();
  }

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

      <Pressable style={styles.cardArea} onPress={handleReveal}>
        {revealed ? (
          <Animated.View style={[styles.revealedCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <CardImage cardId={current.card.id} remoteUrl={current.card.imageUrl} style={styles.cardImage} />
            <Text style={styles.cardName}>{current.card.name}</Text>
            <RarityBadge rarity={current.rarity} />
          </Animated.View>
        ) : (
          <View style={styles.cardBack}>
            <Text style={styles.cardBackLabel}>YuGiPocket</Text>
            <Text style={styles.tapHint}>Tocca per rivelare</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.footer}>
        {revealed && !isLast && <PrimaryButton label="Prossima carta" onPress={handleReveal} />}
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
  cardImage: {
    width: 220,
    height: 320,
    borderRadius: Radius.md,
  },
  cardName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  cardBack: {
    width: 220,
    height: 320,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  cardBackLabel: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  tapHint: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  footer: {
    marginBottom: Spacing.xl,
  },
});
