import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { CardImage } from '@/components/CardImage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RARITY_LABELS } from '@/data/rarity';
import { SET_CONFIGS } from '@/data/sets';
import { getCardsForSet, type SetCardWithRarity } from '@/db/repositories/cardsRepo';
import { addCardToCollection, getCollectionView, removeOneFromCollection } from '@/db/repositories/collectionRepo';
import { encodeTradeOffer } from '@/services/tradeCode';
import type { CollectionCardView, TradeOfferPayload } from '@/types/domain';

export default function TradeCreateScreen() {
  const [ownedCards, setOwnedCards] = useState<CollectionCardView[]>([]);
  const [offer, setOffer] = useState<CollectionCardView | null>(null);

  const [requestSetId, setRequestSetId] = useState(SET_CONFIGS[0].setId);
  const [requestSetCards, setRequestSetCards] = useState<SetCardWithRarity[]>([]);
  const [requestQuery, setRequestQuery] = useState('');
  const [request, setRequest] = useState<SetCardWithRarity | null>(null);

  const [note, setNote] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    getCollectionView({ onlyOwned: true }).then(setOwnedCards);
  }, []);

  useEffect(() => {
    setRequest(null);
    getCardsForSet(requestSetId).then(setRequestSetCards);
  }, [requestSetId]);

  const filteredRequestCards = useMemo(() => {
    const query = requestQuery.trim().toLowerCase();
    if (!query) return requestSetCards;
    return requestSetCards.filter((entry) => entry.card.name.toLowerCase().includes(query));
  }, [requestSetCards, requestQuery]);

  function handleGenerate() {
    if (!offer) return;
    const payload: TradeOfferPayload = {
      v: 1,
      offer: { cardId: offer.id, cardName: offer.name, setId: offer.setId, rarity: offer.rarity },
      request: request
        ? { cardId: request.card.id, cardName: request.card.name, setId: requestSetId, rarity: request.rarity }
        : null,
      note: note.trim(),
      createdAt: Date.now(),
    };
    setGeneratedCode(encodeTradeOffer(payload));
  }

  async function handleCopy() {
    if (!generatedCode) return;
    await Clipboard.setStringAsync(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setGeneratedCode(null);
    setOffer(null);
    setRequest(null);
    setNote('');
    setCompleted(false);
  }

  async function handleMarkCompleted() {
    if (!offer || completed) return;
    await removeOneFromCollection(offer.id, offer.setId);
    if (request) {
      await addCardToCollection(request.card.id, requestSetId, request.rarity, Date.now());
    }
    setCompleted(true);
  }

  if (generatedCode) {
    return (
      <ScreenContainer>
        <View style={styles.resultWrapper}>
          <Text style={styles.sectionTitle}>Proposta pronta</Text>
          <Text style={styles.helperText}>
            Fai scansionare questo QR all&apos;amico, oppure condividi il codice testuale copiandolo.
          </Text>
          <View style={styles.qrBox}>
            <QRCode value={generatedCode} size={220} backgroundColor={Colors.surface} color={Colors.text} />
          </View>
          <PrimaryButton label={copied ? 'Copiato!' : 'Copia codice testuale'} onPress={handleCopy} variant="secondary" />

          <View style={styles.completeBox}>
            <Text style={styles.helperText}>
              Quando l&apos;altra persona ha davvero accettato lo scambio (di persona o confermando dal suo dispositivo),
              premi qui per aggiornare la tua collezione: la carta offerta verrà tolta e quella richiesta (se
              specificata) verrà aggiunta. Nessuna verifica automatica: tocca a te confermarlo onestamente.
            </Text>
            <PrimaryButton
              label={completed ? 'Collezione aggiornata ✓' : 'Segna scambio come completato'}
              onPress={handleMarkCompleted}
              disabled={completed}
            />
          </View>

          <PrimaryButton label="Crea un'altra proposta" onPress={handleReset} variant="secondary" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={filteredRequestCards}
        keyExtractor={(entry) => `${entry.card.id}-${entry.rarity}`}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>1. Carta da offrire</Text>
            <Text style={styles.helperText}>Scegli una carta dalla tua collezione (obbligatorio).</Text>
            {ownedCards.length === 0 ? (
              <Text style={styles.emptyText}>Non possiedi ancora nessuna carta da offrire.</Text>
            ) : (
              <FlatList
                data={ownedCards}
                keyExtractor={(item) => `${item.id}-${item.setId}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setOffer(item)}
                    style={[styles.pickerCard, offer?.id === item.id && offer?.setId === item.setId && styles.pickerCardSelected]}>
                    <CardImage cardId={item.id} remoteUrl={item.imageUrlSmall} style={styles.pickerImage} />
                    <Text style={styles.pickerName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.pickerMeta}>
                      {RARITY_LABELS[item.rarity]} · x{item.quantity}
                    </Text>
                  </Pressable>
                )}
              />
            )}

            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>2. Carta richiesta (opzionale)</Text>
            <Text style={styles.helperText}>Indica una carta specifica che vorresti in cambio, se ne hai una in mente.</Text>
            <View style={styles.setChipRow}>
              {SET_CONFIGS.map((s) => (
                <Pressable
                  key={s.setId}
                  onPress={() => setRequestSetId(s.setId)}
                  style={[styles.setChip, requestSetId === s.setId && styles.setChipSelected]}>
                  <Text style={[styles.setChipText, requestSetId === s.setId && styles.setChipTextSelected]}>
                    {s.setCode}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              placeholder="Cerca per nome…"
              placeholderTextColor={Colors.textMuted}
              value={requestQuery}
              onChangeText={setRequestQuery}
              style={styles.textInput}
            />
            {request && (
              <Pressable onPress={() => setRequest(null)} style={styles.clearRequest}>
                <Text style={styles.clearRequestText}>Richiesta: {request.card.name} · rimuovi</Text>
              </Pressable>
            )}
          </View>
        }
        numColumns={3}
        columnWrapperStyle={styles.requestRow}
        renderItem={({ item }) => {
          const selected = request?.card.id === item.card.id;
          return (
            <Pressable onPress={() => setRequest(item)} style={[styles.requestTile, selected && styles.pickerCardSelected]}>
              <CardImage cardId={item.card.id} remoteUrl={item.card.imageUrlSmall} style={styles.requestImage} />
              <Text style={styles.pickerName} numberOfLines={2}>
                {item.card.name}
              </Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>3. Nota (opzionale)</Text>
            <TextInput
              placeholder="Es. disponibile solo nel weekend…"
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              style={[styles.textInput, styles.noteInput]}
              multiline
            />
            <PrimaryButton label="Genera codice/QR" onPress={handleGenerate} disabled={!offer} />
          </View>
        }
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
  horizontalList: {
    gap: Spacing.md,
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
    marginBottom: Spacing.md,
  },
  noteInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  clearRequest: {
    marginBottom: Spacing.md,
  },
  clearRequestText: {
    color: Colors.primary,
    fontSize: 12,
  },
  requestRow: {
    gap: Spacing.md,
  },
  requestTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
    gap: 2,
  },
  requestImage: {
    width: '100%',
    aspectRatio: 59 / 86,
    borderRadius: 6,
  },
  footer: {
    paddingBottom: Spacing.xxl,
  },
  resultWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  qrBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginVertical: Spacing.lg,
  },
  completeBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
});
