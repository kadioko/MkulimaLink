import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const ProductDetailScreen: React.FC = () => {
  // Mock product data - replace with route params
  const product = {
    id: '1',
    name: 'Fresh Organic Tomatoes',
    description: 'Premium organic tomatoes grown locally in Arusha. Harvested fresh daily and delivered within 24 hours.',
    price: 2500,
    unit: 'kg',
    category: 'vegetables',
    quantity: 50,
    location: {
      region: 'Arusha',
      district: 'Arusha Rural',
    },
    seller: {
      name: 'John Farmer',
      rating: 4.8,
      phone: '+255 712 345 678',
    },
    images: ['🍅', '🥬', '🌱'],
  };

  return (
    <ScrollView style={styles.container}>
      {/* Product Images */}
      <View style={styles.imageContainer}>
        <Text style={styles.productImage}>{product.images[0]}</Text>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>
          TZS {product.price.toLocaleString()}/{product.unit}
        </Text>
        <Text style={styles.productCategory}>{product.category}</Text>
        <Text style={styles.productQuantity}>
          Available: {product.quantity} {product.unit}
        </Text>
      </View>

      {/* Seller Info */}
      <View style={styles.sellerInfo}>
        <Text style={styles.sectionTitle}>Seller Information</Text>
        <View style={styles.sellerCard}>
          <Text style={styles.sellerName}>👨‍🌾 {product.seller.name}</Text>
          <Text style={styles.sellerRating}>⭐ {product.seller.rating}/5.0</Text>
          <Text style={styles.sellerLocation}>
            📍 {product.location.region}, {product.location.district}
          </Text>
        </View>
      </View>

      {/* Product Description */}
      <View style={styles.description}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{product.description}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>📞 Contact Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>🛒 Buy Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  imageContainer: {
    backgroundColor: '#ffffff',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  productImage: {
    fontSize: 80,
  },
  productInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  productCategory: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  productQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  sellerInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sellerCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  sellerRating: {
    fontSize: 14,
    color: '#10b981',
    marginBottom: 4,
  },
  sellerLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  description: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actions: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;
