import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { useCategories } from '@/hooks/useProducts';

interface CategoryChipsProps {
  initialCategory?: string;
}

export default function CategoryChips({ initialCategory = '' }: CategoryChipsProps) {
  const [active, setActive] = useState<string>(initialCategory);
  const { data: categoriesData } = useCategories();

  const CHIPS = React.useMemo(() => {
    const categories = categoriesData || [];
    if (categories.length === 0) {
      return [
        { label: 'TMT Bars',      category: 'TMT Bars' },
        { label: 'GI Pipes',      category: 'GI Pipes' },
        { label: 'Binding Wire',  category: 'Binding Wire' },
        { label: 'Cement',        category: 'Cement' },
        { label: 'View All →',    category: '' },
      ];
    }
    return [
      ...categories.map((cat) => ({ label: cat, category: cat })),
      { label: 'View All →',    category: '' },
    ];
  }, [categoriesData]);

  const handlePress = (category: string) => {
    setActive(category);
    if (category === '') {
      router.push('/(tabs)/search');
    } else {
      router.push({
        pathname: '/(tabs)/search',
        params: { category },
      });
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CHIPS.map((chip) => {
          const isActive = active === chip.category && chip.category !== '';
          const isViewAll = chip.category === '';
          return (
            <TouchableOpacity
              key={chip.label}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                isViewAll && styles.chipViewAll,
              ]}
              onPress={() => handlePress(chip.category)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                  isViewAll && styles.chipTextViewAll,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
  },
  chipTextViewAll: {
    color: colors.primary,
    fontWeight: '700',
  },
  chipViewAll: {
    borderColor: colors.primary,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
  },
  wrapper: {
    marginTop: spacing.md,
  },
});
