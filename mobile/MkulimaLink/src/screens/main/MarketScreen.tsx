import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const MarketScreen: React.FC = () => {
  // Mock market data - replace with API call
  const marketData = [
    { commodity: 'Maize', price: 1200, change: '+50', unit: 'kg' },
    { commodity: 'Rice', price: 2500, change: '-20', unit: 'kg' },
    { commodity: 'Tomatoes', price: 1800, change: '+100', unit: 'kg' },
    { commodity: 'Potatoes', price: 800, change: '+30', unit: 'kg' },
    { commodity: 'Onions', price: 1500, change: '-50', unit: 'kg' },
    { commodity: 'Cabbage', price: 600, change: '+25', unit: 'kg' },
  ];

  const renderMarketItem = (item: typeof marketData[0]) => (
    <View key={item.commodity} style={styles.marketItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.commodityName}>{item.commodity}</Text>
        <Text style={styles.price}>TZS {item.price.toLocaleString()}/{item.unit}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={[
          styles.change,
          { color: item.change.startsWith('+') ? '#10b981' : '#ef4444' }
        ]}>
          {item.change} TZS
        </Text>
        <Text style={styles.trend}>
          {item.change.startsWith('+') ? '📈' : '📉'}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Market Prices</Text>
        <Text style={styles.subtitle}>Current prices in your region</Text>
        <Text style={styles.lastUpdate}>Last updated: Today 2:30 PM</Text>
      </View>

      <View style={styles.priceList}>
        {marketData.map(renderMarketItem)}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📊 View Trends</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>🔔 Price Alerts</Text>
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
    marginBottom: 8,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  priceList: {
    padding: 16,
  },
  marketItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commodityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
  },
  trend: {
    fontSize: 16,
  },
  actions: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MarketScreen;
