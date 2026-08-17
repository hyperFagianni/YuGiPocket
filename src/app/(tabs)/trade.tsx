import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function TradeScreen() {
  return (
    <ScreenContainer>
      <Text variant="heading" style={styles.title}>
        Scambio con gli amici
      </Text>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          Lo scambio in presenza avviene tramite un codice/QR generato sul dispositivo di chi cede le carte. Non
          esiste nessuna verifica reciproca automatica: ogni dispositivo aggiorna la propria collezione in autonomia
          quando l&apos;utente conferma. È un sistema basato sulla fiducia tra amici, non una transazione garantita.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Cedi carte via QR (in presenza)" onPress={() => router.push('/trade-create')} />
        <PrimaryButton
          label="Ricevi carte (scansiona o incolla)"
          variant="secondary"
          onPress={() => router.push('/trade-accept')}
        />
        <PrimaryButton
          label="Bacheca online"
          variant="secondary"
          onPress={() => router.push('/trade-board')}
        />
      </View>
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
  noticeBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  noticeText: {
    color: Colors.textMuted,
    lineHeight: 20,
  },
  actions: {
    gap: Spacing.md,
  },
});
