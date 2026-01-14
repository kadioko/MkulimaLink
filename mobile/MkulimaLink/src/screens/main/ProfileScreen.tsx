import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  const profileItems = [
    { title: 'Personal Information', icon: '👤', action: 'editProfile' },
    { title: 'My Products', icon: '📦', action: 'myProducts' },
    { title: 'Transaction History', icon: '💳', action: 'transactions' },
    { title: 'Payment Methods', icon: '💰', action: 'payments' },
    { title: 'Settings', icon: '⚙️', action: 'settings' },
    { title: 'Help & Support', icon: '❓', action: 'support' },
    { title: 'About MkulimaLink', icon: 'ℹ️', action: 'about' },
  ];

  const handleItemPress = (action: string) => {
    // TODO: Navigate to respective screens
    console.log('Navigate to:', action);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'}
          </Text>
        </View>
      </View>

      {/* Profile Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>28</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        {profileItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleItemPress(item.action)}
          >
            <View style={styles.menuItemContent}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
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
    backgroundColor: '#10b981',
    padding: 24,
    alignItems: 'center',
    paddingTop: 60,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  menu: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  menuTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  logoutContainer: {
    padding: 16,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
