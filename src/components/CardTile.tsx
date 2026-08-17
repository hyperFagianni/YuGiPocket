import React from 'react';
import { StyleSheet, View } from 'react-native';

import { FoilShine } from '@/components/FoilShine';
import { Text } from '@/components/Text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { CollectionCardView } from '@/types/domain';
import { CardImage } from './CardImage';
import { RarityBadge } from './RarityBadge';

export function CardTile({ item }: { item: CollectionCardView }) {
  const owned = item.quantity > 0;
  return (
    <View style={[styles.tile, !owned && styles.unowned]}>
      <View style={styles.imageWrapper}>
        <FoilShine rarity={item.rarity}>
          <CardImage cardId={item.id} remoteUrl={item.imageUrlSmall} style={styles.image} />
          {owned && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>x{item.quantity}</Text>
            </View>
          )}
        </FoilShine>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <RarityBadge rarity={item.rarity} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '31%',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  unowned: {
    opacity: 0.35,
  },
  imageWrapper: {
    aspectRatio: 59 / 86,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  quantityBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quantityText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  name: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
});
