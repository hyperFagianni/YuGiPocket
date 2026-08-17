import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { MultiCardPicker } from '@/components/MultiCardPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RARITY_LABELS } from '@/data/rarity';
import { getCollectionView, removeOneFromCollection } from '@/db/repositories/collectionRepo';
import { encodeTradeOffer } from '@/services/tradeCode';
import type { CollectionCardView, TradeOfferPayload } from '@/types/domain';

function keyOf(item: CollectionCardView) {
  return `${item.id}-${item.setId}`;
}

export default function TradeCreateScreen() {
  const [ownedCards, setOwnedCards] = useState<CollectionCardView[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const [note, setNote] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    getCollectionView({ onlyOwned: true }).then(setOwnedCards);
  }, []);

  const selectedCards = useMemo(
    () => ownedCards.filter((c) => selectedKeys.has(keyOf(c))),
    [ownedCards, selectedKeys],
  );

  function toggleSelected(item: CollectionCardView) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const key = keyOf(item);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleGenerate() {
    if (selectedCards.length === 0) return;
    const payload: TradeOfferPayload = {
      v: 2,
      offer: selectedCards.map((c) => ({ cardId: c.id, cardName: c.name, setId: c.setId, rarity: c.rarity })),
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
    setSelectedKeys(new Set());
    setNote('');
    setCompleted(false);
  }

  async function handleMarkCompleted() {
    if (selectedCards.length === 0 || completed) return;
    for (const card of selectedCards) {
      await removeOneFromCollection(card.id, card.setId);
    }
    setCompleted(true);
  }

  if (generatedCode) {
    return (
      <ScreenContainer>
        <View style={styles.resultWrapper}>
          <Text variant="heading" style={styles.sectionTitle}>
            Proposta pronta
          </Text>
          <Text style={styles.helperText}>
            Fai scansionare questo QR all&apos;amico, oppure condividi il codice testuale copiandolo. Accordatevi di
            persona su cosa ricevi in cambio.
          </Text>
          <View style={styles.qrBox}>
            <QRCode value={generatedCode} size={220} backgroundColor={Colors.surface} color={Colors.text} />
          </View>
          <PrimaryButton label={copied ? 'Copiato!' : 'Copia codice testuale'} onPress={handleCopy} variant="secondary" />

          <View style={styles.completeBox}>
            <Text style={styles.helperText}>
              Quando l&apos;altra persona ha davvero ricevuto queste carte, premi qui per togliere{' '}
              {selectedCards.length > 1 ? 'tutte le carte cedute' : 'la carta ceduta'} dalla tua collezione. Nessuna
              verifica automatica: tocca a te confermarlo onestamente.
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
      <View style={styles.header}>
        <Text variant="heading" style={styles.sectionTitle}>
          Carte da cedere
        </Text>
        <Text style={styles.helperText}>
          Scegli una o più carte dalla tua collezione da dare all&apos;amico. Cosa ricevi in cambio si decide di
          persona.
        </Text>
        {ownedCards.length === 0 ? (
          <Text style={styles.emptyText}>Non possiedi ancora nessuna carta da cedere.</Text>
        ) : (
          <MultiCardPicker cards={ownedCards} selectedKeys={selectedKeys} onToggle={toggleSelected} keyOf={keyOf} />
        )}

        {selectedCards.length > 0 && (
          <View style={styles.selectedSummary}>
            <Text style={styles.selectedSummaryTitle}>
              {selectedCards.length} cart{selectedCards.length > 1 ? 'e' : 'a'} selezionat
              {selectedCards.length > 1 ? 'e' : 'a'}:
            </Text>
            {selectedCards.map((c) => (
              <Text key={keyOf(c)} style={styles.selectedSummaryItem}>
                {c.name} · {RARITY_LABELS[c.rarity]}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text variant="heading" style={[styles.sectionTitle, styles.sectionSpacing]}>
          Nota (opzionale)
        </Text>
        <TextInput
          placeholder="Es. disponibile solo nel weekend…"
          placeholderTextColor={Colors.textMuted}
          value={note}
          onChangeText={setNote}
          style={styles.textInput}
          multiline
        />
        <PrimaryButton label="Genera codice/QR" onPress={handleGenerate} disabled={selectedCards.length === 0} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
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
  selectedSummary: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    gap: 2,
  },
  selectedSummaryTitle: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 2,
  },
  selectedSummaryItem: {
    color: Colors.textMuted,
    fontSize: 12,
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
    minHeight: 60,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: Spacing.lg,
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
