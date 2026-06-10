import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const decoded = decodeURIComponent(category || '');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteProducts({ category: decoded });

  const allProducts = data?.pages.flatMap((p) => p.products) || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{decoded}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.grid}>
          {[1,2,3,4,5,6].map((i) => <View key={i} style={styles.gridItem}><ProductCardSkeleton /></View>)}
        </View>
      ) : allProducts.length === 0 ? (
        <EmptyState icon="folder-open-outline" title="No products" subtitle={`No products found in "${decoded}"`} />
      ) : (
        <FlashList data={allProducts} numColumns={2}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <View style={styles.gridItem}><ProductCard {...item} /></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, paddingHorizontal: spacing.lg },
  gridItem: { width: '47%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  safe: { backgroundColor: colors.background, flex: 1 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
