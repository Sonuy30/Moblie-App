import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useWishlistStore } from '@/stores/wishlistStore';
import { getProducts, StoreProduct } from '@/api/products';
import ProductCard from '@/components/product/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';

export default function WishlistScreen() {
  const ids = useWishlistStore((s) => s.ids);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); setProducts([]); return; }
    // Fetch all products and filter by wishlist IDs
    getProducts({ limit: 100 }).then((data) => {
      const filtered = (data.products || []).filter((p) => ids.includes(p._id));
      setProducts(filtered);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [ids]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.grid}>
          {[1,2,3,4].map((i) => <View key={i} style={styles.gridItem}><ProductCardSkeleton /></View>)}
        </View>
      ) : products.length === 0 ? (
        <EmptyState icon="heart-outline" title="Nothing saved yet" subtitle="Browse products and tap the heart to save" actionLabel="Browse Products" onAction={() => router.push('/(customer)/explore')} />
      ) : (
        <FlatList data={products} numColumns={2} keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list} columnWrapperStyle={styles.row}
          renderItem={({ item }) => <View style={styles.gridItem}><ProductCard {...item} /></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  row: { gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.lg },
  gridItem: { width: '47%' },
});
