import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { productApi } from '../../services/api';

const CATEGORIES = [
  'Vegetables', 'Grains', 'Fruits', 'Livestock',
  'Dairy', 'Poultry', 'Seeds', 'Inputs', 'Equipment', 'Other',
];

const UNITS = ['kg', 'ton', 'bag', 'piece', 'liter', 'dozen', 'bundle'];

const AddProductScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !category || !price || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      await productApi.create({
        name,
        category,
        description,
        price: Number(price),
        quantity: Number(quantity),
        unit,
        location: user?.location,
      });
      Alert.alert('Success', 'Product listed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Fresh Tomatoes"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product..."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price ({user?.location?.region ? 'TZS' : 'TZS'}) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Unit</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.chip, unit === u && styles.chipActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Listing...' : 'List Product'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#ffffff' },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  cancelButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: { color: '#6b7280', fontSize: 16 },
});

export default AddProductScreen;
