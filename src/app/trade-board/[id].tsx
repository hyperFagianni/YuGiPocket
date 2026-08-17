import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MultiCardPicker } from '@/components/MultiCardPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RARITY_LABELS } from '@/data/rarity';
import { SET_CONFIG_BY_ID } from '@/data/sets';
import { addCardToCollection, getCollectionView, removeOneFromCollection } from '@/db/repositories/collectionRepo';
import { ensureAnonymousSession } from '@/services/identity';
import { acceptListing, cancelListing, confirmCompletion, fetchListingById } from '@/services/tradeBoard';
import type { CollectionCardView, TradeCardRef, TradeListing, TradeListingCardRef } from '@/types/domain';

function keyOf(item: CollectionCardView) {
  return `${item.id}-${item.setId}`;
}

function requestedLabel(ref: TradeListingCardRef) {
  if (ref.cardName) return `${ref.cardName} (${RARITY_LABELS[ref.rarity!]})`;
  return `Qualsiasi carta di ${SET_CONFIG_BY_ID[ref.setId]?.displayName ?? ref.setId}`;
}

function cardRefLabel(ref: TradeCardRef) {
  return `${ref.cardName} · ${RARITY_LABELS[ref.rarity]} · ${SET_CONFIG_BY_ID[ref.setId]?.displayName ?? ref.setId}`;
}

export default function TradeBoardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<TradeListing | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmedLocally, setConfirmedLocally] = useState(false);

  const [ownedCards, setOwnedCards] = useState<CollectionCardView[]>([]);
  const [counterKeys, setCounterKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [data, userId] = await Promise.all([fetchListingById(id), ensureAnonymousSession()]);
        setListing(data);
        setMyUserId(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore imprevisto.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    getCollectionView({ onlyOwned: true }).then(setOwnedCards);
  }, []);

  const counterCards = useMemo(() => ownedCards.filter((c) => counterKeys.has(keyOf(c))), [ownedCards, counterKeys]);

  function toggleCounter(item: CollectionCardView) {
    setCounterKeys((prev) => {
      const next = new Set(prev);
      const key = keyOf(item);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const isOwner = listing && myUserId === listing.ownerId;
  const isAccepter = listing && myUserId === listing.acceptedBy;

  async function handleAccept() {
    if (!listing || counterCards.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await acceptListing(
        listing.id,
        counterCards.map((c) => ({ cardId: c.id, cardName: c.name, setId: c.setId, rarity: c.rarity })),
      );
      const refreshed = await fetchListingById(listing.id);
      setListing(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!listing) return;
    setBusy(true);
    try {
      await cancelListing(listing.id);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.');
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!listing) return;
    setBusy(true);
    setError(null);
    try {
      await confirmCompletion(listing.id);
      const now = Date.now();
      if (isOwner) {
        for (const c of listing.offeredCards) await removeOneFromCollection(c.cardId, c.setId);
        for (const c of listing.counterCards) await addCardToCollection(c.cardId, c.setId, c.rarity, now);
      } else if (isAccepter) {
        for (const c of listing.counterCards) await removeOneFromCollection(c.cardId, c.setId);
        for (const c of listing.offeredCards) await addCardToCollection(c.cardId, c.setId, c.rarity, now);
      }
      setConfirmedLocally(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <ScreenContainer>
        <Text style={styles.helperText}>Caricamento…</Text>
      </ScreenContainer>
    );
  }

  if (!listing) {
    return (
      <ScreenContainer>
        <Text style={styles.errorText}>{error ?? 'Annuncio non trovato.'}</Text>
      </ScreenContainer>
    );
  }

  const myConfirmFlag = isOwner ? listing.confirmedByOwner : isAccepter ? listing.confirmedByAccepter : false;
  const alreadyConfirmed = confirmedLocally || myConfirmFlag;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="heading" style={styles.title}>
          Annuncio di {listing.ownerNickname}
        </Text>
        <Text style={styles.statusText}>Stato: {listing.status}</Text>
      </View>

      <Text style={styles.sectionLabel}>{listing.ownerNickname} offre</Text>
      {listing.offeredCards.map((c) => (
        <Text key={`${c.cardId}-${c.setId}`} style={styles.cardLine}>
          {cardRefLabel(c)}
        </Text>
      ))}

      <Text style={styles.sectionLabel}>{listing.ownerNickname} cerca</Text>
      {listing.requestedCards.length > 0 ? (
        listing.requestedCards.map((c, i) => (
          <Text key={i} style={styles.cardLine}>
            {requestedLabel(c)}
          </Text>
        ))
      ) : (
        <Text style={styles.cardLine}>Nessuna richiesta specifica</Text>
      )}

      {listing.note ? <Text style={styles.note}>Nota: {listing.note}</Text> : null}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {listing.status === 'open' && isOwner && (
        <PrimaryButton label="Annulla annuncio" onPress={handleCancel} variant="secondary" loading={busy} />
      )}

      {listing.status === 'open' && !isOwner && (
        <View style={styles.acceptSection}>
          <Text variant="heading" style={styles.sectionTitle}>
            Cosa offri in cambio
          </Text>
          {ownedCards.length === 0 ? (
            <Text style={styles.helperText}>Non possiedi ancora carte da offrire.</Text>
          ) : (
            <MultiCardPicker cards={ownedCards} selectedKeys={counterKeys} onToggle={toggleCounter} keyOf={keyOf} />
          )}
          <PrimaryButton
            label="Accetta scambio"
            onPress={handleAccept}
            disabled={counterCards.length === 0}
            loading={busy}
          />
        </View>
      )}

      {listing.status === 'accepted' && (isOwner || isAccepter) && (
        <View style={styles.acceptSection}>
          <Text style={styles.sectionLabel}>Controproposta ricevuta</Text>
          {listing.counterCards.map((c) => (
            <Text key={`${c.cardId}-${c.setId}`} style={styles.cardLine}>
              {cardRefLabel(c)}
            </Text>
          ))}
          <Text style={styles.helperText}>
            Confermando, la tua collezione viene aggiornata subito su questo dispositivo. Nessuna verifica
            automatica che l&apos;altra persona abbia confermato a sua volta.
          </Text>
          {alreadyConfirmed ? (
            <Text style={styles.success}>Confermato dal tuo lato ✓</Text>
          ) : (
            <PrimaryButton label="Conferma completamento" onPress={handleConfirm} loading={busy} />
          )}
        </View>
      )}

      {listing.status === 'accepted' && !isOwner && !isAccepter && (
        <Text style={styles.helperText}>Questo annuncio è già stato accettato da un altro utente.</Text>
      )}

      {listing.status === 'completed' && <Text style={styles.success}>Scambio completato.</Text>}
      {listing.status === 'cancelled' && <Text style={styles.helperText}>Questo annuncio è stato annullato.</Text>}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statusText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  cardLine: {
    color: Colors.text,
    fontSize: 13,
  },
  note: {
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.md,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.danger,
    marginTop: Spacing.md,
  },
  acceptSection: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  success: {
    color: Colors.success,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
