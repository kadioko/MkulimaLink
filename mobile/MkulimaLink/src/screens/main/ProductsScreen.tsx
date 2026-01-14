import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  location: {
    region: string;
  };
  seller: {
    name: string;
  };
}

const ProductsScreen: React.FC = () => {
  // Mock data - replace with API call
  const products: Product[] = [
    {
      id: '1',
      name: 'Fresh Tomatoes',
      price: 2000,
      unit: 'kg',
      category: 'vegetables',
      location: { region: 'Arusha' },
      seller: { name: 'John Farmer' },
    },
    {
      id: '2',
      name: 'Organic Maize',
      price: 1500,
      unit: 'kg',
      category: 'grains',
      location: { region: 'Mwanza' },
      seller: { name: 'Mary Farmer' },
    },
    {
      id: '3',
      name: 'Fresh Mangoes',
      price: 3000,
      unit: 'kg',
      category: 'fruits',
      location: { region: 'Tanga' },
      seller: { name: 'Peter Farmer' },
    },
  ];

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>
          TZS {item.price.toLocaleString()}/{item.unit}
        </Text>
      </View>
      <View style={styles.productDetails}>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productLocation}>📍 {item.location.region}</Text>
        <Text style={styles.productSeller}>👤 {item.seller.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Text style={styles.subtitle}>Fresh produce from local farmers</Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
});

export default ProductsScreen;
