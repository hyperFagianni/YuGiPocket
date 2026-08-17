import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { CardImage } from '@/components/CardImage';
import { FoilShine } from '@/components/FoilShine';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RARITY_LABELS } from '@/data/rarity';
import { SET_CONFIG_BY_ID } from '@/data/sets';
import { getCardById } from '@/db/repositories/cardsRepo';
import { addCardToCollection } from '@/db/repositories/collectionRepo';
import { decodeTradeOffer } from '@/services/tradeCode';
import type { CardRecord, TradeCardRef, TradeOfferPayload } from '@/types/domain';

export default function TradeAcceptScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerActive, setScannerActive] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [payload, setPayload] = useState<TradeOfferPayload | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [offerCards, setOfferCards] = useState<Map<number, CardRecord | null> | null>(null);

  useEffect(() => {
    if (!payload) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        payload.offer.map(async (ref) => [ref.cardId, await getCardById(ref.cardId)] as const),
      );
      if (!cancelled) setOfferCards(new Map(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  function tryDecode(code: string) {
    const parsed = decodeTradeOffer(code);
    if (!parsed) {
      setDecodeError("Codice non riconosciuto. Controlla di aver copiato l'intero codice o riprova la scansione.");
      setPayload(null);
      return;
    }
    setDecodeError(null);
    setOfferCards(null);
    setConfirmed(false);
    setPayload(parsed);
    setScannerActive(false);
  }

  async function handlePasteFromClipboard() {
    const text = await Clipboard.getStringAsync();
    setPasteText(text);
    tryDecode(text);
  }

  const cardsResolved = offerCards !== null;
  const cardsRecognized = cardsResolved && payload!.offer.every((ref) => offerCards!.get(ref.cardId));

  async function handleConfirm() {
    if (!payload || !cardsRecognized) return;
    const now = Date.now();
    for (const ref of payload.offer) {
      await addCardToCollection(ref.cardId, ref.setId, ref.rarity, now);
    }
    setConfirmed(true);
  }

  function handleCancel() {
    setPayload(null);
    setPasteText('');
    setDecodeError(null);
  }

  function refLabel(ref: TradeCardRef) {
    const set = SET_CONFIG_BY_ID[ref.setId];
    return `${RARITY_LABELS[ref.rarity]} · ${set?.displayName ?? ref.setId}`;
  }

  if (payload) {
    return (
      <ScreenContainer>
        <Text variant="heading" style={styles.title}>
          Riepilogo scambio
        </Text>

        <Text style={styles.previewLabel}>
          {payload.offer.length > 1 ? `Ricevi queste ${payload.offer.length} carte` : 'Ricevi questa carta'}
        </Text>
        {payload.offer.map((ref) => {
          const card = offerCards?.get(ref.cardId);
          return (
            <View key={`${ref.cardId}-${ref.setId}`} style={styles.cardPreview}>
              <View style={styles.previewRow}>
                <View style={styles.previewImageBox}>
                  {card ? (
                    <FoilShine rarity={ref.rarity}>
                      <CardImage cardId={card.id} remoteUrl={card.imageUrlSmall} style={styles.previewImage} />
                    </FoilShine>
                  ) : (
                    <View style={[styles.previewImage, styles.previewImagePlaceholder]} />
                  )}
                </View>
                <View style={styles.previewText}>
                  <Text style={styles.cardName}>{ref.cardName}</Text>
                  <Text style={styles.cardMeta}>{refLabel(ref)}</Text>
                  {cardsResolved && !card && (
                    <Text style={styles.errorText}>Carta non presente nel database locale di questo dispositivo.</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {payload.note ? <Text style={styles.note}>Nota: {payload.note}</Text> : null}

        <Text style={styles.warning}>
          Confermando, la tua collezione viene aggiornata subito su questo dispositivo. Fallo solo se ti fidi e lo
          scambio è già avvenuto davvero di persona.
        </Text>

        {confirmed ? (
          <Text style={styles.success}>Collezione aggiornata! Puoi tornare alla schermata Scambio.</Text>
        ) : (
          <PrimaryButton
            label="Confermo, aggiorna la mia collezione"
            onPress={handleConfirm}
            disabled={!cardsRecognized}
          />
        )}
        <PrimaryButton
          label={confirmed ? 'Torna allo Scambio' : 'Annulla'}
          variant="secondary"
          onPress={confirmed ? () => router.back() : handleCancel}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text variant="heading" style={styles.title}>
        Accetta una proposta
      </Text>

      {scannerActive ? (
        permission?.granted ? (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={(result) => tryDecode(result.data)}
            />
          </View>
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.helperText}>Serve il permesso della fotocamera per scansionare il QR.</Text>
            <PrimaryButton label="Consenti fotocamera" onPress={requestPermission} />
          </View>
        )
      ) : (
        <PrimaryButton label="Scansiona QR" onPress={() => setScannerActive(true)} />
      )}

      <Text variant="heading" style={[styles.sectionTitle, styles.sectionSpacing]}>
        Oppure incolla il codice
      </Text>
      <TextInput
        placeholder="YGP1:..."
        placeholderTextColor={Colors.textMuted}
        value={pasteText}
        onChangeText={setPasteText}
        style={styles.textInput}
        multiline
      />
      {decodeError && <Text style={styles.errorText}>{decodeError}</Text>}
      <PrimaryButton label="Incolla dagli appunti" variant="secondary" onPress={handlePasteFromClipboard} />
      <PrimaryButton label="Verifica codice" onPress={() => tryDecode(pasteText)} disabled={!pasteText.trim()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSpacing: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    marginBottom: Spacing.md,
  },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  permissionBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardPreview: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  previewImageBox: {
    width: 64,
    height: 93,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  previewImagePlaceholder: {
    backgroundColor: Colors.surfaceElevated,
  },
  previewText: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    color: Colors.text,
    fontWeight: '700',
  },
  cardMeta: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  note: {
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  warning: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  success: {
    color: Colors.success,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
});
