import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RARITY_LABELS } from '@/data/rarity';
import { SET_CONFIG_BY_ID } from '@/data/sets';
import { getLocalNickname } from '@/services/identity';
import { isTradeBoardConfigured } from '@/services/firebase';
import { fetchMyListings, fetchOpenListings, subscribeToListings } from '@/services/tradeBoard';
import type { TradeListing, TradeListingCardRef } from '@/types/domain';

function setLabel(setId: string) {
  return SET_CONFIG_BY_ID[setId]?.displayName ?? setId;
}

function requestedLabel(ref: TradeListingCardRef) {
  if (ref.cardName) return `${ref.cardName} (${RARITY_LABELS[ref.rarity!]})`;
  return `Qualsiasi carta di ${setLabel(ref.setId)}`;
}

export default function TradeBoardScreen() {
  const [ready, setReady] = useState<'checking' | 'needs-nickname' | 'unconfigured' | 'ready'>('checking');
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (currentTab: 'all' | 'mine') => {
    setLoading(true);
    try {
      const data = currentTab === 'all' ? await fetchOpenListings() : await fetchMyListings();
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isTradeBoardConfigured) {
        setReady('unconfigured');
        return;
      }
      getLocalNickname().then((nickname) => {
        setReady(nickname ? 'ready' : 'needs-nickname');
      });
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (ready !== 'ready') return;
      load(tab);
      const unsubscribe = subscribeToListings(() => load(tab));
      return unsubscribe;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, tab]),
  );

  if (ready === 'unconfigured') {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text variant="heading" style={styles.title}>
            Bacheca non configurata
          </Text>
          <Text style={styles.helperText}>
            Questa build dell&apos;app non ha una bacheca online collegata. Vedi il README del progetto per
            configurarne una (gratuita, tramite Firebase).
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (ready === 'needs-nickname') {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text variant="heading" style={styles.title}>
            Scegli un nome
          </Text>
          <Text style={styles.helperText}>
            Per usare la bacheca online serve un nome visibile agli altri utenti (anonimo, nessuna email).
          </Text>
          <PrimaryButton label="Scegli il tuo nome" onPress={() => router.push('/nickname-setup')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text variant="heading" style={styles.title}>
        Bacheca online
      </Text>
      <Text style={styles.helperText}>
        Pubblica cosa cerchi e cosa offri in cambio. Altri utenti possono accettare proponendo le loro carte.
      </Text>

      <View style={styles.tabRow}>
        <Pressable onPress={() => setTab('all')} style={[styles.tabChip, tab === 'all' && styles.tabChipActive]}>
          <Text style={[styles.tabChipText, tab === 'all' && styles.tabChipTextActive]}>Tutti gli annunci</Text>
        </Pressable>
        <Pressable onPress={() => setTab('mine')} style={[styles.tabChip, tab === 'mine' && styles.tabChipActive]}>
          <Text style={[styles.tabChipText, tab === 'mine' && styles.tabChipTextActive]}>I miei</Text>
        </Pressable>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={() => load(tab)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              {tab === 'all' ? 'Nessun annuncio aperto al momento.' : 'Non hai ancora creato o accettato annunci.'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/trade-board/${item.id}`)}>
            <View style={styles.cardHeader}>
              <Text style={styles.ownerName}>{item.ownerNickname}</Text>
              <Text style={styles.statusBadge}>{statusLabel(item.status)}</Text>
            </View>
            <Text style={styles.sectionLabel}>Offre</Text>
            <Text style={styles.cardsList}>{item.offeredCards.map((c) => c.cardName).join(', ')}</Text>
            <Text style={styles.sectionLabel}>Cerca</Text>
            <Text style={styles.cardsList}>
              {item.requestedCards.length > 0 ? item.requestedCards.map(requestedLabel).join(', ') : 'Nessuna richiesta specifica'}
            </Text>
          </Pressable>
        )}
      />

      <PrimaryButton label="Crea nuovo annuncio" onPress={() => router.push('/trade-board-create')} />
    </ScreenContainer>
  );
}

function statusLabel(status: TradeListing['status']) {
  switch (status) {
    case 'open':
      return 'Aperto';
    case 'accepted':
      return 'Accettato';
    case 'completed':
      return 'Completato';
    case 'cancelled':
      return 'Annullato';
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  tabChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  tabChipText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  tabChipTextActive: {
    color: Colors.primary,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  ownerName: {
    color: Colors.text,
    fontWeight: '700',
  },
  statusBadge: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  cardsList: {
    color: Colors.text,
    fontSize: 13,
  },
});
