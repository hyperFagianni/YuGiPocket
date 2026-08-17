import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CardImage } from '@/components/CardImage';
import { MultiCardPicker } from '@/components/MultiCardPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RARITY_LABELS } from '@/data/rarity';
import { SET_CONFIGS } from '@/data/sets';
import { getCardsForSet, type SetCardWithRarity } from '@/db/repositories/cardsRepo';
import { getCollectionView } from '@/db/repositories/collectionRepo';
import { createListing } from '@/services/tradeBoard';
import type { CollectionCardView, TradeListingCardRef } from '@/types/domain';

function keyOf(item: CollectionCardView) {
  return `${item.id}-${item.setId}`;
}

export default function TradeBoardCreateScreen() {
  const [ownedCards, setOwnedCards] = useState<CollectionCardView[]>([]);
  const [offerKeys, setOfferKeys] = useState<Set<string>>(new Set());
  const [requestedCards, setRequestedCards] = useState<TradeListingCardRef[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pickerSetId, setPickerSetId] = useState(SET_CONFIGS[0].setId);
  const [pickerCards, setPickerCards] = useState<SetCardWithRarity[]>([]);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerCard, setPickerCard] = useState<SetCardWithRarity | null>(null);

  useEffect(() => {
    getCollectionView({ onlyOwned: true }).then(setOwnedCards);
  }, []);

  useEffect(() => {
    setPickerCard(null);
    getCardsForSet(pickerSetId).then(setPickerCards);
  }, [pickerSetId]);

  const filteredPickerCards = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return pickerCards;
    return pickerCards.filter((entry) => entry.card.name.toLowerCase().includes(q));
  }, [pickerCards, pickerQuery]);

  const offeredCards = useMemo(() => ownedCards.filter((c) => offerKeys.has(keyOf(c))), [ownedCards, offerKeys]);

  function toggleOffer(item: CollectionCardView) {
    setOfferKeys((prev) => {
      const next = new Set(prev);
      const key = keyOf(item);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function addRequestSpecific() {
    if (!pickerCard) return;
    setRequestedCards((prev) => [
      ...prev,
      { cardId: pickerCard.card.id, cardName: pickerCard.card.name, setId: pickerSetId, rarity: pickerCard.rarity },
    ]);
    setPickerCard(null);
    setPickerQuery('');
  }

  function addRequestAnyOfSet() {
    setRequestedCards((prev) => [...prev, { cardId: null, cardName: null, setId: pickerSetId, rarity: null }]);
  }

  function removeRequest(index: number) {
    setRequestedCards((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (offeredCards.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const id = await createListing({
        offeredCards: offeredCards.map((c) => ({ cardId: c.id, cardName: c.name, setId: c.setId, rarity: c.rarity })),
        requestedCards,
        note,
      });
      router.replace(`/trade-board/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto durante la pubblicazione.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <FlatList
        data={[]}
        keyExtractor={() => 'none'}
        renderItem={null}
        ListHeaderComponent={
          <View>
            <Text variant="heading" style={styles.sectionTitle}>
              Cosa offri
            </Text>
            <Text style={styles.helperText}>Scegli una o più carte dalla tua collezione.</Text>
            {ownedCards.length === 0 ? (
              <Text style={styles.emptyText}>Non possiedi ancora nessuna carta da offrire.</Text>
            ) : (
              <MultiCardPicker cards={ownedCards} selectedKeys={offerKeys} onToggle={toggleOffer} keyOf={keyOf} />
            )}

            <Text variant="heading" style={[styles.sectionTitle, styles.sectionSpacing]}>
              Cosa cerchi (opzionale)
            </Text>
            <Text style={styles.helperText}>
              Aggiungi una carta specifica o &quot;qualsiasi carta&quot; di un&apos;espansione che ti interessa.
            </Text>

            {requestedCards.length > 0 && (
              <View style={styles.requestedList}>
                {requestedCards.map((ref, index) => (
                  <View key={index} style={styles.requestedChip}>
                    <Text style={styles.requestedChipText}>
                      {ref.cardName ?? `Qualsiasi carta · ${ref.setId.toUpperCase()}`}
                    </Text>
                    <Pressable onPress={() => removeRequest(index)}>
                      <Text style={styles.removeChip}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.setChipRow}>
              {SET_CONFIGS.map((s) => (
                <Pressable
                  key={s.setId}
                  onPress={() => setPickerSetId(s.setId)}
                  style={[styles.setChip, pickerSetId === s.setId && styles.setChipSelected]}>
                  <Text style={[styles.setChipText, pickerSetId === s.setId && styles.setChipTextSelected]}>
                    {s.setCode}
                  </Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton label={`Aggiungi: qualsiasi carta di questa espansione`} onPress={addRequestAnyOfSet} variant="secondary" />

            <TextInput
              placeholder="...oppure cerca una carta specifica"
              placeholderTextColor={Colors.textMuted}
              value={pickerQuery}
              onChangeText={setPickerQuery}
              style={styles.textInput}
            />
            {pickerQuery.trim().length > 0 && (
              <FlatList
                data={filteredPickerCards.slice(0, 12)}
                keyExtractor={(entry) => String(entry.card.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => {
                  const selected = pickerCard?.card.id === item.card.id;
                  return (
                    <Pressable
                      onPress={() => setPickerCard(item)}
                      style={[styles.pickerCard, selected && styles.pickerCardSelected]}>
                      <CardImage cardId={item.card.id} remoteUrl={item.card.imageUrlSmall} style={styles.pickerImage} />
                      <Text style={styles.pickerName} numberOfLines={2}>
                        {item.card.name}
                      </Text>
                      <Text style={styles.pickerMeta}>{RARITY_LABELS[item.rarity]}</Text>
                    </Pressable>
                  );
                }}
              />
            )}
            {pickerCard && (
              <PrimaryButton label={`Aggiungi richiesta: ${pickerCard.card.name}`} onPress={addRequestSpecific} variant="secondary" />
            )}

            <Text variant="heading" style={[styles.sectionTitle, styles.sectionSpacing]}>
              Nota (opzionale)
            </Text>
            <TextInput
              placeholder="Es. disponibile solo nel weekend…"
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              style={[styles.textInput, styles.noteInput]}
              multiline
            />

            {error && <Text style={styles.errorText}>{error}</Text>}
            <PrimaryButton
              label="Pubblica annuncio"
              onPress={handleSubmit}
              loading={submitting}
              disabled={offeredCards.length === 0}
            />
          </View>
        }
        contentContainerStyle={styles.footer}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  sectionSpacing: {
    marginTop: Spacing.xl,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  requestedList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  requestedChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  requestedChipText: {
    color: Colors.text,
    fontSize: 13,
    flex: 1,
  },
  removeChip: {
    color: Colors.danger,
    fontWeight: '700',
    paddingHorizontal: Spacing.sm,
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
  setChipText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  setChipTextSelected: {
    color: Colors.primary,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  noteInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  horizontalList: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  pickerCard: {
    width: 96,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs,
    gap: 2,
  },
  pickerCardSelected: {
    borderColor: Colors.primary,
  },
  pickerImage: {
    width: '100%',
    aspectRatio: 59 / 86,
    borderRadius: 6,
  },
  pickerName: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  pickerMeta: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  errorText: {
    color: Colors.danger,
    marginBottom: Spacing.md,
  },
  footer: {
    paddingBottom: Spacing.xxl,
  },
});
