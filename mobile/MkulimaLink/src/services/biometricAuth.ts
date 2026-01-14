import ReactNativeBiometrics, { BiometryType } from 'react-native-biometrics';
import Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

interface BiometricCredentials {
  username: string;
  password: string;
}

class BiometricAuthService {
  private static instance: BiometricAuthService;
  private rnBiometrics: ReactNativeBiometrics;
  private biometricType: BiometryType | null = null;

  private constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<{
    available: boolean;
    biometryType: BiometryType | null;
    error?: string;
  }> {
    try {
      const { available, biometryType, error } = await this.rnBiometrics.isSensorAvailable();

      if (available) {
        this.biometricType = biometryType;
      }

      return {
        available,
        biometryType,
        error,
      };
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return {
        available: false,
        biometryType: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get biometric type name for display
   */
  getBiometricTypeName(): string {
    switch (this.biometricType) {
      case 'TouchID':
        return 'Touch ID';
      case 'FaceID':
        return 'Face ID';
      case 'Biometrics':
        return Platform.OS === 'android' ? 'Fingerprint' : 'Biometrics';
      default:
        return 'Biometric Authentication';
    }
  }

  /**
   * Create biometric keys for encryption
   */
  async createKeys(): Promise<{
    success: boolean;
    publicKey?: string;
    error?: string;
  }> {
    try {
      const { success, publicKey, error } = await this.rnBiometrics.createKeys();

      if (success) {
        console.log('Biometric keys created successfully');
      } else {
        console.error('Failed to create biometric keys:', error);
      }

      return { success, publicKey, error };
    } catch (error) {
      console.error('Error creating biometric keys:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store credentials securely with biometric protection
   */
  async storeCredentials(username: string, password: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const credentials: BiometricCredentials = { username, password };
      const credentialsString = JSON.stringify(credentials);

      // On iOS, we can use biometric protection directly
      // On Android, we'll use the biometric prompt before storing
      if (Platform.OS === 'ios') {
        await Keychain.setGenericPassword(username, credentialsString, {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } else {
        // For Android, we'll store with basic protection and require biometric prompt
        await Keychain.setGenericPassword(username, credentialsString, {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      }

      // Store biometric preference
      await AsyncStorage.setItem('biometricEnabled', 'true');

      console.log('Credentials stored with biometric protection');
      return { success: true };
    } catch (error) {
      console.error('Failed to store credentials:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve credentials with biometric authentication
   */
  async retrieveCredentials(): Promise<{
    success: boolean;
    credentials?: BiometricCredentials;
    error?: string;
  }> {
    try {
      // Check if biometric is enabled
      const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');
      if (biometricEnabled !== 'true') {
        return {
          success: false,
          error: 'Biometric authentication not enabled',
        };
      }

      // Perform biometric authentication
      const biometricResult = await this.authenticateBiometric('Authenticate to access your account');

      if (!biometricResult.success) {
        return {
          success: false,
          error: biometricResult.error || 'Biometric authentication failed',
        };
      }

      // Retrieve credentials from secure storage
      const credentials = await Keychain.getGenericPassword();

      if (!credentials) {
        return {
          success: false,
          error: 'No stored credentials found',
        };
      }

      const parsedCredentials: BiometricCredentials = JSON.parse(credentials.password);

      return {
        success: true,
        credentials: parsedCredentials,
      };
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Perform biometric authentication
   */
  async authenticateBiometric(reason?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { success, error } = await this.rnBiometrics.simplePrompt({
        promptMessage: reason || 'Authenticate with biometrics',
        cancelButtonText: 'Cancel',
        fallbackPromptMessage: 'Use device PIN',
      });

      return { success, error };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Delete stored biometric credentials
   */
  async deleteCredentials(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await Keychain.resetGenericPassword();
      await AsyncStorage.removeItem('biometricEnabled');

      console.log('Biometric credentials deleted');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if biometric is enabled for current user
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('biometricEnabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric status:', error);
      return false;
    }
  }

  /**
   * Setup biometric authentication for user
   */
  async setupBiometric(username: string, password: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if biometric is available
      const availability = await this.isBiometricAvailable();
      if (!availability.available) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device',
        };
      }

      // Create biometric keys if needed
      const keysResult = await this.createKeys();
      if (!keysResult.success) {
        console.warn('Failed to create biometric keys, continuing anyway');
      }

      // Store credentials with biometric protection
      const storeResult = await this.storeCredentials(username, password);
      if (!storeResult.success) {
        return storeResult;
      }

      // Test biometric authentication
      const testResult = await this.authenticateBiometric('Setup complete! Test your biometrics');
      if (!testResult.success) {
        // If test fails, clean up stored credentials
        await this.deleteCredentials();
        return {
          success: false,
          error: 'Biometric setup failed during testing',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Biometric setup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Setup failed',
      };
    }
  }

  /**
   * Sign in with biometrics
   */
  async signInWithBiometric(): Promise<{
    success: boolean;
    credentials?: BiometricCredentials;
    error?: string;
  }> {
    try {
      const credentialsResult = await this.retrieveCredentials();

      if (!credentialsResult.success) {
        return credentialsResult;
      }

      return {
        success: true,
        credentials: credentialsResult.credentials,
      };
    } catch (error) {
      console.error('Biometric sign in failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }

  /**
   * Show biometric setup prompt
   */
  async showSetupPrompt(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Enable Biometric Login',
        `Would you like to enable ${this.getBiometricTypeName()} for faster login?`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Enable',
            onPress: async () => {
              const result = await this.setupBiometric(username, password);
              if (result.success) {
                Alert.alert(
                  'Success',
                  `${this.getBiometricTypeName()} enabled! Use it for faster login next time.`,
                  [{ text: 'OK', onPress: () => resolve(true) }]
                );
              } else {
                Alert.alert(
                  'Setup Failed',
                  result.error || 'Failed to enable biometric login',
                  [{ text: 'OK', onPress: () => resolve(false) }]
                );
              }
            },
          },
        ]
      );
    });
  }
}

// Create singleton instance
export const biometricAuthService = BiometricAuthService.getInstance();

// React hook for biometric authentication
export const useBiometricAuth = () => {
  const isBiometricAvailable = () => biometricAuthService.isBiometricAvailable();

  const getBiometricTypeName = () => biometricAuthService.getBiometricTypeName();

  const isBiometricEnabled = () => biometricAuthService.isBiometricEnabled();

  const setupBiometric = (username: string, password: string) =>
    biometricAuthService.setupBiometric(username, password);

  const signInWithBiometric = () => biometricAuthService.signInWithBiometric();

  const deleteCredentials = () => biometricAuthService.deleteCredentials();

  const showSetupPrompt = (username: string, password: string) =>
    biometricAuthService.showSetupPrompt(username, password);

  const authenticateBiometric = (reason?: string) =>
    biometricAuthService.authenticateBiometric(reason);

  return {
    isBiometricAvailable,
    getBiometricTypeName,
    isBiometricEnabled,
    setupBiometric,
    signInWithBiometric,
    deleteCredentials,
    showSetupPrompt,
    authenticateBiometric,
  };
};

export default biometricAuthService;
