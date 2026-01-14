import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

interface NotificationData {
  title: string;
  message: string;
  data?: any;
  id?: string;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;
  private fcmToken: string | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure local push notifications
      PushNotification.configure({
        // Called when a remote or local notification is opened or received
        onNotification: (notification) => {
          console.log('NOTIFICATION:', notification);

          // Handle notification tap
          if (notification.userInteraction) {
            this.handleNotificationTap(notification);
          }
        },

        // Called when the user returns from the background
        onAction: (notification) => {
          console.log('ACTION:', notification.action);
          console.log('NOTIFICATION:', notification);
        },

        // Called when a remote is received or opened
        onRemoteFetch: (notificationData) => {
          console.log('REMOTE FETCH:', notificationData);
        },

        // Permissions
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },

        // Should the initial notification be popped automatically
        popInitialNotification: true,

        // Request permissions on iOS
        requestPermissions: Platform.OS === 'ios',
      });

      // Initialize Firebase messaging
      await this.initializeFirebaseMessaging();

      this.isInitialized = true;
      console.log('Push notification service initialized');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private async initializeFirebaseMessaging(): Promise<void> {
    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);

        // Get FCM token
        const token = await messaging().getToken();
        this.fcmToken = token;
        console.log('FCM Token:', token);

        // Store token locally
        await AsyncStorage.setItem('fcmToken', token);

        // Send token to server
        await this.sendTokenToServer(token);

        // Handle token refresh
        messaging().onTokenRefresh(async (newToken) => {
          console.log('FCM Token refreshed:', newToken);
          this.fcmToken = newToken;
          await AsyncStorage.setItem('fcmToken', newToken);
          await this.sendTokenToServer(newToken);
        });

        // Handle foreground messages
        messaging().onMessage(async (remoteMessage) => {
          console.log('Foreground message:', remoteMessage);
          this.showLocalNotification({
            title: remoteMessage.notification?.title || 'MkulimaLink',
            message: remoteMessage.notification?.body || '',
            data: remoteMessage.data,
          });
        });

        // Handle background messages (when app is killed)
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
          console.log('Background message:', remoteMessage);
        });
      } else {
        console.log('User declined notifications');
      }
    } catch (error) {
      console.error('Firebase messaging setup failed:', error);
    }
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      await apiService.post('/notifications/token', {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to send token to server:', error);
    }
  }

  async showLocalNotification({ title, message, data, id }: NotificationData): Promise<void> {
    PushNotification.localNotification({
      id: id || Date.now().toString(),
      title,
      message,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
      userInfo: data,
      largeIcon: 'ic_launcher', // Android
      smallIcon: 'ic_notification', // Android
    });
  }

  async showScheduledNotification(
    { title, message, data }: NotificationData,
    delayInSeconds: number
  ): Promise<void> {
    PushNotification.localNotificationSchedule({
      title,
      message,
      date: new Date(Date.now() + delayInSeconds * 1000),
      playSound: true,
      soundName: 'default',
      userInfo: data,
    });
  }

  private handleNotificationTap(notification: any): void {
    const data = notification.data || notification.userInfo;

    if (data?.type === 'product') {
      // Navigate to product detail
      // NavigationService.navigate('ProductDetail', { productId: data.productId });
    } else if (data?.type === 'chat') {
      // Navigate to chat
      // NavigationService.navigate('Chat', { chatId: data.chatId });
    } else if (data?.type === 'transaction') {
      // Navigate to transaction detail
      // NavigationService.navigate('TransactionDetail', { transactionId: data.transactionId });
    }
    // Add more navigation handlers as needed
  }

  async cancelNotification(notificationId: string): Promise<void> {
    PushNotification.cancelLocalNotifications({ id: notificationId });
  }

  async cancelAllNotifications(): Promise<void> {
    PushNotification.cancelAllLocalNotifications();
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }

  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem('fcmToken');
  }

  // Test notification (for development)
  async showTestNotification(): Promise<void> {
    await this.showLocalNotification({
      title: 'Test Notification',
      message: 'This is a test push notification from MkulimaLink!',
      data: { type: 'test' },
    });
  }

  // Request permissions (can be called from settings)
  async requestPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        await this.initializeFirebaseMessaging();
      }

      return enabled;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // Check permission status
  async checkPermissions(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
    settings: any;
  }> {
    const settings = await messaging().hasPermission();
    const granted =
      settings === messaging.AuthorizationStatus.AUTHORIZED ||
      settings === messaging.AuthorizationStatus.PROVISIONAL;

    return {
      granted,
      canAskAgain: settings === messaging.AuthorizationStatus.DENIED,
      settings,
    };
  }
}

// Create singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

// React hook for using push notifications
export const usePushNotifications = () => {
  const initialize = () => pushNotificationService.initialize();

  const showNotification = (notification: NotificationData) =>
    pushNotificationService.showLocalNotification(notification);

  const showScheduledNotification = (notification: NotificationData, delay: number) =>
    pushNotificationService.showScheduledNotification(notification, delay);

  const cancelNotification = (id: string) =>
    pushNotificationService.cancelNotification(id);

  const cancelAllNotifications = () =>
    pushNotificationService.cancelAllNotifications();

  const requestPermissions = () =>
    pushNotificationService.requestPermissions();

  const checkPermissions = () =>
    pushNotificationService.checkPermissions();

  const showTestNotification = () =>
    pushNotificationService.showTestNotification();

  return {
    initialize,
    showNotification,
    showScheduledNotification,
    cancelNotification,
    cancelAllNotifications,
    requestPermissions,
    checkPermissions,
    showTestNotification,
  };
};

export default pushNotificationService;
