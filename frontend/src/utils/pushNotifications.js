/**
 * Push Notifications Service
 * Handles web push notifications using Service Workers
 */

class PushNotificationService {
  constructor() {
    this.publicKey = process.env.VITE_VAPID_PUBLIC_KEY || 
      'BLbZxJ1K2Y4t8X7p3Q6R9w5E2T8Y7U4I1O0P3A6S9D2F5G8H1J4K7L0M3N6P9Q';
    this.subscription = null;
    this.isSupported = this.checkSupport();
  }

  /**
   * Check if push notifications are supported
   */
  checkSupport() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Initialize the service
   */
  async init() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');

      // Get existing subscription
      this.subscription = await registration.pushManager.getSubscription();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId) {
    if (!this.isSupported) return null;

    try {
      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicKey)
      });

      this.subscription = subscription;

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription, userId);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) return false;

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription, userId) {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription,
          userId,
          userAgent: navigator.userAgent,
          platform: navigator.platform
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  /**
   * Convert base64 to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Check if subscribed
   */
  isSubscribed() {
    return !!this.subscription;
  }

  /**
   * Get subscription status
   */
  async getStatus() {
    if (!this.isSupported) {
      return {
        supported: false,
        permission: 'unsupported',
        subscribed: false
      };
    }

    return {
      supported: true,
      permission: Notification.permission,
      subscribed: this.isSubscribed(),
      subscription: this.subscription
    };
  }

  /**
   * Show local notification (fallback)
   */
  async showLocalNotification(title, options = {}) {
    if (!this.isSupported) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'mkulimalink',
        renotify: true,
        requireInteraction: false,
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to relevant page
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }
}

// Notification templates
const notificationTemplates = {
  newOrder: (order) => ({
    title: 'New Order Received! 🎉',
    body: `You have a new order for ${order.productName}`,
    icon: '/icons/order.png',
    data: { url: `/transactions/${order.id}` }
  }),

  orderUpdate: (order) => ({
    title: `Order ${order.status}!`,
    body: `Your order is now ${order.status}`,
    icon: '/icons/order.png',
    data: { url: `/transactions/${order.id}` }
  }),

  priceAlert: (alert) => ({
    title: 'Price Alert! 📈',
    body: `${alert.productName} is now ${alert.triggerType} ${alert.triggerPrice} TZS`,
    icon: '/icons/price.png',
    data: { url: `/products/${alert.productId}` }
  }),

  messageReceived: (message) => ({
    title: `New message from ${message.senderName}`,
    body: message.content,
    icon: '/icons/message.png',
    data: { url: `/chats/${message.chatId}` }
  }),

  loanApproved: (loan) => ({
    title: 'Loan Approved! 💰',
    body: `Your ${loan.amount} TZS loan has been approved`,
    icon: '/icons/loan.png',
    data: { url: `/loans/${loan.id}` }
  }),

  groupBuyJoined: (groupBuy) => ({
    title: 'Group Buy Update! 👥',
    body: `Someone joined your ${groupBuy.productName} group buy`,
    icon: '/icons/group.png',
    data: { url: `/group-buying/${groupBuy.id}` }
  }),

  deliveryUpdate: (delivery) => ({
    title: 'Delivery Update! 🚚',
    body: `Your order is ${delivery.status}`,
    icon: '/icons/delivery.png',
    data: { url: `/delivery/${delivery.id}` }
  })
};

// Singleton instance
const pushNotificationService = new PushNotificationService();

// Auto-initialize
if (typeof window !== 'undefined') {
  pushNotificationService.init();
}

export {
  PushNotificationService,
  pushNotificationService,
  notificationTemplates
};

export default pushNotificationService;
