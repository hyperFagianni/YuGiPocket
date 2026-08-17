import React from 'react';
import { Text as RNText, TextProps } from 'react-native';

import { Fonts } from '@/constants/fonts';

type Variant = 'body' | 'heading';

export function Text({ style, variant = 'body', ...props }: TextProps & { variant?: Variant }) {
  const fontFamily = variant === 'heading' ? Fonts.heading : Fonts.body;
  return <RNText style={[{ fontFamily }, style]} {...props} />;
}
