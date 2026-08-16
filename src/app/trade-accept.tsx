import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { CardImage } from '@/components/CardImage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RARITY_LABELS } from '@/data/rarity';
import { SET_CONFIG_BY_ID } from '@/data/sets';
import { getCardById } from '@/db/repositories/cardsRepo';
import { addCardToCollection, removeOneFromCollection } from '@/db/repositories/collectionRepo';
import { decodeTradeOffer } from '@/services/tradeCode';
import type { CardRecord, TradeOfferPayload } from '@/types/domain';

export default function TradeAcceptScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerActive, setScannerActive] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [payload, setPayload] = useState<TradeOfferPayload | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [offerCard, setOfferCard] = useState<CardRecord | null | undefined>(undefined);
  const [requestCard, setRequestCard] = useState<CardRecord | null | undefined>(undefined);

  useEffect(() => {
    if (!payload) return;
    let cancelled = false;
    getCardById(payload.offer.cardId).then((card) => {
      if (!cancelled) setOfferCard(card);
    });
    if (payload.request) {
      getCardById(payload.request.cardId).then((card) => {
        if (!cancelled) setRequestCard(card);
      });
    } else {
      setRequestCard(null);
    }
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
    setOfferCard(undefined);
    setRequestCard(undefined);
    setConfirmed(false);
    setPayload(parsed);
    setScannerActive(false);
  }

  async function handlePasteFromClipboard() {
    const text = await Clipboard.getStringAsync();
    setPasteText(text);
    tryDecode(text);
  }

  const cardsResolved = offerCard !== undefined && requestCard !== undefined;
  const cardsRecognized = cardsResolved && offerCard !== null && (payload?.request === null || requestCard !== null);

  async function handleConfirm() {
    if (!payload || !cardsRecognized) return;
    await addCardToCollection(payload.offer.cardId, payload.offer.setId, payload.offer.rarity, Date.now());
    if (payload.request) {
      await removeOneFromCollection(payload.request.cardId, payload.request.setId);
    }
    setConfirmed(true);
  }

  function handleCancel() {
    setPayload(null);
    setPasteText('');
    setDecodeError(null);
  }

  if (payload) {
    const offerSet = SET_CONFIG_BY_ID[payload.offer.setId];
    const requestSet = payload.request ? SET_CONFIG_BY_ID[payload.request.setId] : null;

    return (
      <ScreenContainer>
        <Text style={styles.title}>Riepilogo scambio</Text>

        <View style={styles.cardPreview}>
          <Text style={styles.previewLabel}>Ricevi</Text>
          <View style={styles.previewRow}>
            {offerCard ? (
              <CardImage cardId={offerCard.id} remoteUrl={offerCard.imageUrlSmall} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewImage, styles.previewImagePlaceholder]} />
            )}
            <View style={styles.previewText}>
              <Text style={styles.cardName}>{payload.offer.cardName}</Text>
              <Text style={styles.cardMeta}>
                {RARITY_LABELS[payload.offer.rarity]} · {offerSet?.displayName ?? payload.offer.setId}
              </Text>
            </View>
          </View>
        </View>

        {payload.request ? (
          <View style={styles.cardPreview}>
            <Text style={styles.previewLabel}>Dai in cambio</Text>
            <View style={styles.previewRow}>
              {requestCard ? (
                <CardImage cardId={requestCard.id} remoteUrl={requestCard.imageUrlSmall} style={styles.previewImage} />
              ) : (
                <View style={[styles.previewImage, styles.previewImagePlaceholder]} />
              )}
              <View style={styles.previewText}>
                <Text style={styles.cardName}>{payload.request.cardName}</Text>
                <Text style={styles.cardMeta}>
                  {RARITY_LABELS[payload.request.rarity]} · {requestSet?.displayName ?? payload.request.setId}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.helperText}>Nessuna carta specifica richiesta in cambio.</Text>
        )}

        {payload.note ? <Text style={styles.note}>Nota: {payload.note}</Text> : null}

        {cardsResolved && !cardsRecognized && (
          <Text style={styles.errorText}>
            Una delle carte di questo codice non è presente nel database locale di questo dispositivo (forse manca
            ancora quell&apos;espansione). Non è possibile confermare lo scambio in modo sicuro.
          </Text>
        )}

        <Text style={styles.warning}>
          Confermando, la tua collezione viene aggiornata subito su questo dispositivo. Non c&apos;è nessun controllo
          automatico che l&apos;altra persona abbia davvero ricevuto la carta richiesta: fallo solo se ti fidi e lo
          scambio è già avvenuto davvero.
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
      <Text style={styles.title}>Accetta una proposta</Text>

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

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Oppure incolla il codice</Text>
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
  previewImage: {
    width: 64,
    height: 93,
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
