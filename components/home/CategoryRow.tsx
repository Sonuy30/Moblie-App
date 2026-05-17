import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

interface CategoryRowProps {
  categories: string[];
}

const getIcon = (cat: string): keyof typeof Ionicons.glyphMap => {
  const l = cat.toLowerCase();
  if (l.includes('electronics')) return 'hardware-chip-outline';
  if (l.includes('computers')) return 'laptop-outline';
  if (l.includes('accessories')) return 'headset-outline';
  if (l.includes('gaming')) return 'game-controller-outline';
  if (l.includes('wearables')) return 'watch-outline';
  if (l.includes('pipe')) return 'construct-outline';
  if (l.includes('hardware')) return 'hammer-outline';
  if (l.includes('tool')) return 'build-outline';
  if (l.includes('steel')) return 'cube-outline';
  if (l.includes('electric')) return 'flash-outline';
  return 'grid-outline';
};

export default function CategoryRow({ categories }: CategoryRowProps) {
  if (!categories?.length) return null;
  return (
    <FlatList
      data={categories}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.pill}
          onPress={() => router.push(`/category/${encodeURIComponent(item)}` as any)}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={getIcon(item)} size={20} color={colors.primary} />
          </View>
          <Text style={styles.label} numberOfLines={1}>{item}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
  pill: { alignItems: 'center', width: 76, gap: 6 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '500', color: colors.text, textAlign: 'center' },
});
