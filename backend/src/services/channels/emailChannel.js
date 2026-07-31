import { sendEmail } from '../../utils/sendEmail.js';

class EmailChannel {
  constructor() {
    this.name = 'email';
  }

  /**
   * Delivers an email to the recipient.
   */
  async send(recipientUser, notificationPayload) {
    try {
      if (!recipientUser.email) {
        return { success: false, channel: this.name, error: 'No email address registered for user' };
      }

      // Convert body template or use message body directly
      const htmlContent = notificationPayload.html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
          <h2>${notificationPayload.title}</h2>
          <p>${notificationPayload.message}</p>
          <hr/>
          <p style="color: #666; font-size: 12px;">This is an automated notification from CA E-Learning ERP.</p>
        </div>
      `;

      await sendEmail({
        to: recipientUser.email,
        subject: notificationPayload.title,
        html: htmlContent
      });

      return { success: true, channel: this.name };
    } catch (err) {
      console.error('❌ EmailChannel Send Failure:', err.message);
      return { success: false, channel: this.name, error: err.message };
    }
  }
}

export default new EmailChannel();
