import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { AppDataProvider, useAppData } from '@/context/AppDataProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { status, fatalError, retry } = useAppData();

  useEffect(() => {
    if (status !== 'initializing') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [status]);

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Errore di avvio</Text>
        <Text style={styles.errorBody}>{fatalError}</Text>
        <Text style={styles.retry} onPress={retry}>
          Riprova
        </Text>
      </View>
    );
  }

  if (status === 'initializing') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Preparazione della collezione…</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="opening" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="trade-create" options={{ title: 'Crea proposta di scambio' }} />
      <Stack.Screen name="trade-accept" options={{ title: 'Accetta proposta di scambio' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppDataProvider>
          <RootNavigator />
        </AppDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    color: Colors.textMuted,
  },
  errorTitle: {
    color: Colors.danger,
    fontSize: 18,
    fontWeight: '700',
  },
  errorBody: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
  retry: {
    color: Colors.primary,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
});
