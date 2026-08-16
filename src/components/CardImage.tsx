import React, { useEffect, useState } from 'react';
import type { ImageStyle, StyleProp } from 'react-native';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { ensureCardImageCached, getCachedCardImageUri } from '@/services/imageCache';

interface Props {
  cardId: number;
  remoteUrl: string;
  style?: StyleProp<ImageStyle>;
}

/**
 * Renders a card image, always from the local cache — never a live remote URL.
 * The very first time a given card is shown, it's downloaded once via
 * ensureCardImageCached and saved to disk; every render after that (and every
 * future app launch) reads the local file straight away.
 */
export function CardImage({ cardId, remoteUrl, style }: Props) {
  const [uri, setUri] = useState<string | null>(() => getCachedCardImageUri(cardId));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (uri) return;
    let cancelled = false;
    ensureCardImageCached(cardId, remoteUrl)
      .then((localUri) => {
        if (!cancelled) setUri(localUri);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId, remoteUrl, uri]);

  if (uri) {
    return <Image source={{ uri }} style={style} resizeMode="contain" />;
  }

  return <View style={[styles.placeholder, style]}>{!failed && <ActivityIndicator color={Colors.primary} />}</View>;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
