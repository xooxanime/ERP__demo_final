import inAppChannel from './channels/inAppChannel.js';
import whatsappChannel from './channels/whatsappChannel.js';
import emailChannel from './channels/emailChannel.js';

class NotificationDispatcher {
  constructor() {
    this.channels = new Map();
    this.registerChannel(inAppChannel);
    this.registerChannel(whatsappChannel);
    this.registerChannel(emailChannel);
  }

  /**
   * Register a new channel worker.
   */
  registerChannel(channelInstance) {
    this.channels.set(channelInstance.name, channelInstance);
    console.log(`📡 Registered Notification Channel: ${channelInstance.name}`);
  }

  /**
   * Dispatch a notification payload to all enabled channels based on user preferences.
   */
  async dispatch(recipientUser, notificationPayload) {
    if (!recipientUser) {
      console.warn('⚠️ Dispatch aborted: No recipient user object provided');
      return [];
    }

    // Default preferences merged with user settings
    const defaultPreferences = {
      inApp: true,
      whatsapp: true,
      email: true,
      sms: false
    };
    const preferences = {
      ...defaultPreferences,
      ...(recipientUser.notificationPreferences ? (typeof recipientUser.notificationPreferences.toObject === 'function' ? recipientUser.notificationPreferences.toObject() : recipientUser.notificationPreferences) : {})
    };

    const deliveryPromises = [];

    for (const [channelName, channelWorker] of this.channels.entries()) {
      // Check if user has enabled this channel
      const isEnabled = preferences[channelName];
      
      // Override: Account validation, password resets, or critical system events bypass preferences for essential delivery
      const isCriticalOverride = ['password_reset', 'welcome_verification', 'account_approved'].includes(notificationPayload.erpEvent);

      if (isEnabled || isCriticalOverride) {
        // Run channel delivery asynchronously (non-blocking)
        deliveryPromises.push(
          channelWorker.send(recipientUser, notificationPayload)
            .then(res => ({ channel: channelName, ...res }))
            .catch(err => ({ channel: channelName, success: false, error: err.message }))
        );
      } else {
        console.log(`⏭️ Channel "${channelName}" skipped for user ${recipientUser._id} (preference disabled)`);
      }
    }

    // Await all deliveries and return results summary
    const results = await Promise.all(deliveryPromises);
    return results;
  }
}

export default new NotificationDispatcher();
