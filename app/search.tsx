import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts, type StoreProduct } from '@/api/products';
import ProductCardWide from '@/components/product/ProductCardWide';
import { SearchResultSkeleton } from '@/components/skeletons/SearchResultSkeleton';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const RECENT_KEY = 'aits_recent_searches';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StoreProduct[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(RECENT_KEY).then((v) => {
      if (v) setRecent(JSON.parse(v) as string[]);
    });
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await getProducts({ search: q, limit: 15 });
      setResults(data.products || []);
    } catch {
      /* empty */
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const saveRecent = async (q: string) => {
    const updated = [q, ...recent.filter((r) => r !== q)].slice(0, 5);
    setRecent(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const clearRecent = async () => {
    setRecent([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput style={styles.input} placeholder="Search products..." placeholderTextColor={colors.textMuted}
            value={query} onChangeText={setQuery} autoFocus returnKeyType="search"
            onSubmitEditing={() => { if (query.trim()) { void saveRecent(query.trim()); router.push({ pathname: '/(customer)/explore', params: { search: query } }); } }} />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {query.length === 0 ? (
        <View style={styles.suggestions}>
          {recent.length > 0 && (
            <>
              <View style={styles.sugHeader}>
                <Text style={styles.sugTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={() => { void clearRecent(); }}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>
              </View>
              <View style={styles.chips}>
                {recent.map((r) => (
                  <TouchableOpacity key={r} style={styles.chip} onPress={() => { setQuery(r); }}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.chipText}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          <Text style={styles.sugTitle}>Popular Searches</Text>
          <View style={styles.chips}>
            {['iPhone', 'MacBook', 'Monitor', 'Headphones', 'Keyboard'].map((t) => (
              <TouchableOpacity key={t} style={styles.chip} onPress={() => setQuery(t)}>
                <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : searching ? (
        <FlatList data={[1, 2, 3, 4, 5, 6]} keyExtractor={(item) => String(item)}
          contentContainerStyle={styles.resultList}
          renderItem={() => <SearchResultSkeleton />}
        />
      ) : (
        <FlatList data={results} keyExtractor={(item) => item._id}
          contentContainerStyle={styles.resultList}
          renderItem={({ item }) => <ProductCardWide {...item} />}
          ListEmptyComponent={<Text style={styles.noResults}>No results for &quot;{query}&quot;</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cancel: { color: colors.primary, fontSize: 15, fontWeight: '500' },
  chip: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.full, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clearText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  input: { color: colors.text, flex: 1, fontSize: 15 },
  noResults: { color: colors.textMuted, fontSize: 14, marginTop: spacing['4xl'], textAlign: 'center' },
  resultList: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  safe: { backgroundColor: colors.background, flex: 1 },
  searchBar: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, flex: 1, flexDirection: 'row', gap: 8, height: 44, paddingHorizontal: spacing.md },
  sugHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sugTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  suggestions: { gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
});
