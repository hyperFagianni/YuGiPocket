import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { CardImage } from '@/components/CardImage';
import { FoilShine } from '@/components/FoilShine';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RARITY_LABELS } from '@/data/rarity';
import type { CollectionCardView } from '@/types/domain';

interface Props {
  cards: CollectionCardView[];
  selectedKeys: Set<string>;
  onToggle: (item: CollectionCardView) => void;
  keyOf: (item: CollectionCardView) => string;
}

export function MultiCardPicker({ cards, selectedKeys, onToggle, keyOf }: Props) {
  return (
    <FlatList
      data={cards}
      keyExtractor={keyOf}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const key = keyOf(item);
        const selected = selectedKeys.has(key);
        return (
          <Pressable onPress={() => onToggle(item)} style={[styles.card, selected && styles.cardSelected]}>
            <View style={styles.imageWrapper}>
              <FoilShine rarity={item.rarity}>
                <CardImage cardId={item.id} remoteUrl={item.imageUrlSmall} style={styles.image} />
                {selected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </FoilShine>
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.meta}>
              {RARITY_LABELS[item.rarity]} · x{item.quantity}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  card: {
    width: 96,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs,
    gap: 2,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.surfaceElevated,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 59 / 86,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: Colors.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  name: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  meta: {
    color: Colors.textMuted,
    fontSize: 10,
  },
});
