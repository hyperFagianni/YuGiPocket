import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { SET_CONFIGS } from '@/data/sets';

export default function AboutScreen() {
  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text variant="heading" style={styles.title}>
          Info su YuGiPocket
        </Text>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Non affiliato con Konami</Text>
          <Text style={styles.boxText}>
            YuGiPocket è un progetto amatoriale, gratuito e non ufficiale, creato da un fan. Non è prodotto,
            sponsorizzato, approvato o in alcun modo affiliato con Konami Digital Entertainment o con Yu-Gi-Oh!.
            Tutti i nomi delle carte, i marchi e le immagini appartengono ai rispettivi proprietari.
          </Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Gratuito, senza pubblicità, senza acquisti</Text>
          <Text style={styles.boxText}>
            L&apos;app non contiene acquisti in-app, abbonamenti né pubblicità di alcun tipo. È interamente gratuita e
            funziona offline, salvo il download iniziale (una tantum) dei dati delle carte da YGOPRODeck.
          </Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Pull rate: stime della community, non dati ufficiali</Text>
          <Text style={styles.boxText}>
            Konami non pubblica percentuali ufficiali di estrazione per le buste fisiche. Le probabilità usate in
            questa app sono stime ricavate da fonti della community (Yugipedia, articoli di settore, statistiche
            aggregate da collezionisti) e sono soggette a incertezza. Il dettaglio delle fonti e del livello di
            affidabilità è riportato qui sotto per ciascuna espansione.
          </Text>
        </View>

        {SET_CONFIGS.map((set) => (
          <View key={set.setId} style={styles.box}>
            <Text style={styles.boxTitle}>{set.displayName}</Text>
            <Text style={styles.boxText}>{set.sourceNote}</Text>
            {set.excludedCardsNote ? <Text style={[styles.boxText, styles.excludedNote]}>{set.excludedCardsNote}</Text> : null}
          </View>
        ))}

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Crediti</Text>
          <Text style={styles.boxText}>
            Metadati e immagini delle carte forniti dalla API pubblica di YGOPRODeck (db.ygoprodeck.com), scaricati
            una sola volta per ogni carta e messi in cache localmente sul dispositivo, come richiesto dalle loro
            condizioni di utilizzo.
          </Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Limiti dello scambio tra amici</Text>
          <Text style={styles.boxText}>
            Lo scambio avviene tramite un codice/QR generato localmente, senza alcun server né verifica reciproca
            automatica: ciascun dispositivo aggiorna la propria collezione in autonomia quando l&apos;utente conferma.
            È un sistema basato sulla fiducia tra amici, non una transazione garantita.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  boxTitle: {
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  boxText: {
    color: Colors.textMuted,
    lineHeight: 20,
    fontSize: 13,
  },
  excludedNote: {
    marginTop: Spacing.sm,
  },
});
