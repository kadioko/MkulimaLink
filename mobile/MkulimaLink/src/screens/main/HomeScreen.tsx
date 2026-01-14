import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>🛒</Text>
          <Text style={styles.actionTitle}>Browse Products</Text>
          <Text style={styles.actionDesc}>Find fresh produce</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionTitle}>Market Prices</Text>
          <Text style={styles.actionDesc}>Check current rates</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionTitle}>My Transactions</Text>
          <Text style={styles.actionDesc}>View your orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📱</Text>
          <Text style={styles.actionTitle}>Messages</Text>
          <Text style={styles.actionDesc}>Chat with sellers</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>No recent activity</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#10b981',
    padding: 24,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  quickActions: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  recentActivity: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  activityItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  activityText: {
    color: '#6b7280',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
