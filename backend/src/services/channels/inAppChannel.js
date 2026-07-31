import Notification from '../../models/Notification.js';

class InAppChannel {
  constructor() {
    this.name = 'inApp';
  }

  /**
   * Delivers the notification to the persistent database collection.
   */
  async send(recipientUser, notificationPayload) {
    try {
      const { title, message, type, section, courseName, priority, expiryDate, attachment } = notificationPayload;

      const notif = await Notification.create({
        recipient: recipientUser._id,
        title,
        message,
        type: type || 'info',
        section: section || 'general',
        priority: priority || 'normal',
        courseName,
        expiryDate: expiryDate || null,
        attachment: attachment || null
      });

      return { success: true, channel: this.name, data: notif };
    } catch (err) {
      console.error('❌ InAppChannel Send Failure:', err.message);
      return { success: false, channel: this.name, error: err.message };
    }
  }
}

export default new InAppChannel();
