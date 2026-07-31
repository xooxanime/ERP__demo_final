import whatsappService from '../whatsappService.js';
import { buildTemplate } from '../templates/whatsappTemplates.js';

class WhatsAppChannel {
  constructor() {
    this.name = 'whatsapp';
  }

  /**
   * Delivers template-based WhatsApp notifications.
   */
  async send(recipientUser, notificationPayload) {
    try {
      const erpEvent = notificationPayload.erpEvent || 'custom';
      
      // Build the template parameters payload using the centralized templates builder
      const templateConfig = buildTemplate(erpEvent, notificationPayload.templateData || {});
      
      const logRecord = await whatsappService.sendTemplateMessage(
        recipientUser,
        erpEvent,
        templateConfig
      );

      return { success: !!logRecord, channel: this.name, data: logRecord };
    } catch (err) {
      console.error('❌ WhatsAppChannel Send Failure:', err.message);
      return { success: false, channel: this.name, error: err.message };
    }
  }
}

export default new WhatsAppChannel();
