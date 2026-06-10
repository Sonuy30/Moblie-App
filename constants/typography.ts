import { type TextStyle } from 'react-native';

type TypographyStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'>;

export const typography: Record<string, TypographyStyle> = {
  displayLarge:  { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  displayMedium: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  headingLarge:  { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  headingMedium: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  headingSmall:  { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  bodyLarge:     { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyMedium:    { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall:     { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption:       { fontSize: 11, fontWeight: '500', lineHeight: 14 },
  label:         { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, lineHeight: 14 },
};

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
