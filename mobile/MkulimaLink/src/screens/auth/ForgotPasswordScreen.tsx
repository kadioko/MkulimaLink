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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axios from 'axios';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const navigation = useNavigation();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email,
      });

      setEmailSent(true);
      Toast.show({
        type: 'success',
        text1: 'Reset Email Sent',
        text2: 'Check your email for password reset instructions',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🔑 Reset Password</Text>
            <Text style={styles.subtitle}>
              {emailSent
                ? 'Check your email for reset instructions'
                : 'Enter your email to reset your password'
              }
            </Text>
          </View>

          {!emailSent ? (
            /* Reset Form */
            <View style={styles.form}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Success Message */
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                We've sent password reset instructions to:
              </Text>
              <Text style={styles.emailText}>{email}</Text>
              <Text style={styles.instructions}>
                Click the link in the email to reset your password.
                The link will expire in 1 hour.
              </Text>
            </View>
          )}

          {/* Back to Login */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={styles.backLink}>
                {emailSent ? 'Back to Sign In' : 'Remember your password? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
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
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  backLink: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
