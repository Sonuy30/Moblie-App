import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
  style?: ViewStyle;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const avatarColors = [
  '#185FA5', '#3B6D11', '#854F0B', '#A32D2D', '#6B21A8',
  '#0E7490', '#B45309', '#047857', '#7C3AED', '#BE185D',
];

const getColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

export default function Avatar({ name, uri, size = 48, style }: AvatarProps) {
  if (uri) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
        {/* If we had expo-image here we'd use it, but for avatar we use a simple view */}
        <View
          style={[
            styles.initialsContainer,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: getColor(name) },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.initialsContainer,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: getColor(name) },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  initials: {
    color: colors.white,
    fontWeight: '700',
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
