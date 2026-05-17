import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts, StoreProduct } from '@/api/products';
import ProductCardWide from '@/components/product/ProductCardWide';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const RECENT_KEY = 'aits_recent_searches';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StoreProduct[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((v) => { if (v) setRecent(JSON.parse(v)); });
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await getProducts({ search: q, limit: 15 });
      setResults(data.products || []);
    } catch {} finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

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
            onSubmitEditing={() => { if (query.trim()) { saveRecent(query.trim()); router.push({ pathname: '/(tabs)/explore', params: { search: query } } as any); } }} />
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
                <TouchableOpacity onPress={clearRecent}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>
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
      ) : (
        <FlatList data={results} keyExtractor={(item) => item._id}
          contentContainerStyle={styles.resultList}
          renderItem={({ item }) => <ProductCardWide {...item} />}
          ListEmptyComponent={!searching ? <Text style={styles.noResults}>No results for "{query}"</Text> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: spacing.md, height: 44, gap: 8 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  cancel: { fontSize: 15, fontWeight: '500', color: colors.primary },
  suggestions: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg },
  sugHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sugTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  clearText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full },
  chipText: { fontSize: 13, color: colors.textSecondary },
  resultList: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  noResults: { textAlign: 'center', fontSize: 14, color: colors.textMuted, marginTop: spacing['4xl'] },
});
