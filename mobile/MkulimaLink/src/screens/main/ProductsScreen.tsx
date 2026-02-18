import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../services/api';

interface Product {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  currency?: string;
  region?: string;
  location?: { region: string };
  seller?: { name: string };
}

const ProductsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => productApi.getAll(selectedCategory ? { category: selectedCategory } : {}),
  });

  const products: Product[] = (data as any)?.products || [];
  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const CATEGORIES = ['', 'Vegetables', 'Grains', 'Fruits', 'Dairy', 'Seeds', 'Inputs'];

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => (navigation as any).navigate('ProductDetail', { productId: item._id || item.id })}
    >
      <View style={styles.productHeader}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>
          {item.currency || 'TZS'} {item.price.toLocaleString()}/{item.unit}
        </Text>
      </View>
      <View style={styles.productDetails}>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productLocation}>📍 {item.region || item.location?.region || '-'}</Text>
        {item.seller?.name && <Text style={styles.productSeller}>👤 {item.seller.name}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor="#9ca3af"
        />
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item || 'all'}
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRow}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                {cat || 'All'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  productDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCategory: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  productLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  productSeller: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    color: '#111827',
    marginTop: 8,
    marginBottom: 8,
  },
  categoryRow: {
    marginBottom: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  catChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  catChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
  },
});

export default ProductsScreen;
