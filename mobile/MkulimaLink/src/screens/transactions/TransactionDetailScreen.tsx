import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
  processing: '#3b82f6',
};

const TransactionDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { transactionId } = route.params as { transactionId: string };

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionApi.getById(transactionId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => transactionApi.updateStatus(transactionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      Alert.alert('Success', 'Transaction status updated');
    },
    onError: () => Alert.alert('Error', 'Failed to update status'),
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Transaction not found</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[transaction.status] || '#6b7280';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{transaction.status?.toUpperCase()}</Text>
      </View>

      {/* Product Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Product</Text>
        <Text style={styles.productName}>{transaction.product?.name || 'Product'}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Quantity</Text>
          <Text style={styles.value}>
            {transaction.quantity} {transaction.product?.unit}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Amount</Text>
          <Text style={styles.valueHighlight}>
            {transaction.currency || 'TZS'} {transaction.totalAmount?.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Transaction Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Transaction ID</Text>
          <Text style={styles.value} numberOfLines={1}>{transaction._id || transaction.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {transaction.createdAt
              ? new Date(transaction.createdAt).toLocaleDateString()
              : '-'}
          </Text>
        </View>
        {transaction.commission != null && (
          <View style={styles.row}>
            <Text style={styles.label}>Platform Fee (5%)</Text>
            <Text style={styles.value}>
              {transaction.currency || 'TZS'} {transaction.commission?.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Delivery Info */}
      {transaction.deliveryDetails && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{transaction.deliveryDetails.phone}</Text>
          </View>
          {transaction.deliveryDetails.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{transaction.deliveryDetails.address}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      {transaction.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.confirmBtn]}
            onPress={() => updateStatusMutation.mutate('completed')}
            disabled={updateStatusMutation.isPending}
          >
            <Text style={styles.actionBtnText}>Mark as Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={() =>
              Alert.alert('Cancel Transaction', 'Are you sure?', [
                { text: 'No' },
                { text: 'Yes', onPress: () => updateStatusMutation.mutate('cancelled') },
              ])
            }
            disabled={updateStatusMutation.isPending}
          >
            <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6b7280', fontSize: 16 },
  emptyText: { color: '#6b7280', fontSize: 16 },
  statusBanner: {
    padding: 16,
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: { fontSize: 14, color: '#6b7280' },
  value: { fontSize: 14, color: '#374151', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  valueHighlight: { fontSize: 16, color: '#10b981', fontWeight: '700' },
  actions: { margin: 16, marginBottom: 0, gap: 10 },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmBtn: { backgroundColor: '#10b981', borderColor: '#10b981' },
  cancelBtn: { backgroundColor: '#ffffff', borderColor: '#ef4444' },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  backBtn: { margin: 16, paddingVertical: 12, alignItems: 'center' },
  backBtnText: { color: '#6b7280', fontSize: 15 },
});

export default TransactionDetailScreen;
