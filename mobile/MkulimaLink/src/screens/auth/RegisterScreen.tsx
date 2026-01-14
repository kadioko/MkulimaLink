import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../../stores/authStore';
import Toast from 'react-native-toast-message';

const TANZANIAN_REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera',
  'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara',
  'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pwani',
  'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Tabora', 'Tanga'
];

const RegisterScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'farmer' as 'farmer' | 'buyer',
    region: '',
    district: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  const { register } = useAuthStore();

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { name, email, phone, password, confirmPassword, region, district } = formData;

    if (!name || !email || !phone || !password || !region || !district) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }

    const phoneRegex = /^(?:\+255|0)?[67]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Please enter a valid Tanzanian phone number');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      Toast.show({
        type: 'success',
        text1: 'Welcome to MkulimaLink!',
        text2: 'Account created successfully',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>🌾 Join MkulimaLink</Text>
              <Text style={styles.subtitle}>Create your account</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                placeholder="e.g. 0712345678"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>I am a *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.role}
                  onValueChange={(value) => updateFormData('role', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Farmer" value="farmer" />
                  <Picker.Item label="Buyer" value="buyer" />
                </Picker>
              </View>

              <Text style={styles.label}>Region *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.region}
                  onValueChange={(value) => updateFormData('region', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Region" value="" />
                  {TANZANIAN_REGIONS.map((region) => (
                    <Picker.Item key={region} label={region} value={region} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>District *</Text>
              <TextInput
                style={styles.input}
                value={formData.district}
                onChangeText={(value) => updateFormData('district', value)}
                placeholder="Enter your district"
                autoCapitalize="words"
              />

              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Create a password"
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                placeholder="Confirm your password"
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.registerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginBottom: 4,
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
