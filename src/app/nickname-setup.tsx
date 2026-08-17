import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { registerNickname } from '@/services/identity';

export default function NicknameSetupScreen() {
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    const trimmed = nickname.trim();
    if (trimmed.length < 3) {
      setError('Scegli un nome di almeno 3 caratteri.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await registerNickname(trimmed);
      router.back();
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes('duplicate')
          ? 'Questo nome è già in uso, scegline un altro.'
          : err instanceof Error
            ? err.message
            : 'Errore imprevisto.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text variant="heading" style={styles.title}>
          Come vuoi farti chiamare?
        </Text>
        <Text style={styles.helperText}>
          Questo nome è visibile agli altri utenti sulla bacheca online degli scambi. Non serve email né
          password: l&apos;identità è anonima, legata solo a questo dispositivo.
        </Text>
        <TextInput
          placeholder="Es. DuelistaDiRoma"
          placeholderTextColor={Colors.textMuted}
          value={nickname}
          onChangeText={setNickname}
          style={styles.textInput}
          autoFocus
          maxLength={24}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        <PrimaryButton label="Continua" onPress={handleContinue} loading={submitting} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
  },
});
