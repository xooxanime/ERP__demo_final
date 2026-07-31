import https from 'https';
import WhatsAppLog from '../models/WhatsAppLog.js';
import { formatPhoneNumber } from '../utils/phoneFormatter.js';
import circuitBreaker from './circuitBreaker.js';

export const isMockMode = () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  return !token || token.startsWith('mock_') || process.env.NODE_ENV === 'test';
};

/**
 * Service to manage outbound WhatsApp notifications via Meta Cloud API.
 */
class WhatsAppService {
  constructor() {
    this.baseUrl = 'graph.facebook.com';
  }

  /**
   * Safe check if WhatsApp is configured and enabled.
   */
  isEnabled() {
    return process.env.WHATSAPP_ENABLED === 'true';
  }

  /**
   * Primary method to send a template-based outbound message.
   * Resolves recipient user details, formats phone, calls Meta (or mocks), and logs database records.
   */
  async sendTemplateMessage(recipientUser, erpEvent, templateConfig) {
    if (!this.isEnabled()) {
      console.log('🚫 WhatsApp is disabled in system configurations');
      return null;
    }

    const { id: recipientId, phone } = recipientUser;
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone) {
      console.error(`⚠️ WhatsApp send aborted: Invalid phone number for user ${recipientId}`);
      return null;
    }

    const { name: templateName, language, components, fallback } = templateConfig;

    // Create database log record in 'pending' status
    const whatsappLog = await WhatsAppLog.create({
      recipientId,
      phone: formattedPhone,
      templateName,
      erpEvent,
      status: 'pending',
      retries: 0
    });

    if (isMockMode()) {
      return this._sendMock(whatsappLog, components, fallback);
    } else {
      return circuitBreaker.execute(() => 
        this._sendReal(whatsappLog, formattedPhone, templateConfig)
      );
    }
  }

  /**
   * Internal method for sending real Meta Cloud API requests.
   */
  async _sendReal(whatsappLog, formattedPhone, templateConfig) {
    return new Promise((resolve, reject) => {
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';
      const path = `/${apiVersion}/${phoneId}/messages`;

      const payload = JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone.replace('+', ''), // Meta API handles leading code without '+'
        type: 'template',
        template: {
          name: templateConfig.name,
          language: {
            code: templateConfig.language || 'en_US'
          },
          components: templateConfig.components
        }
      });

      const options = {
        hostname: this.baseUrl,
        path: path,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        
        res.on('end', async () => {
          try {
            const parsed = JSON.parse(responseBody);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const msgId = parsed.messages?.[0]?.id;
              
              whatsappLog.status = 'sent';
              whatsappLog.messageId = msgId;
              whatsappLog.providerResponse = parsed;
              whatsappLog.sentAt = new Date();
              await whatsappLog.save();

              console.log(`✅ WhatsApp sent via Meta Cloud API. Message ID: ${msgId}`);
              resolve(whatsappLog);
            } else {
              const errorDetail = parsed.error || { message: 'Unknown Meta API error' };
              await this._handleSendError(whatsappLog, errorDetail);
              reject(new Error(errorDetail.message));
            }
          } catch (e) {
            await this._handleSendError(whatsappLog, { message: `Payload Parse Error: ${e.message}`, code: 500 });
            reject(e);
          }
        });
      });

      req.on('error', async (err) => {
        console.error('❌ Meta HTTP Request Exception:', err);
        await this._handleSendError(whatsappLog, { message: err.message, code: 500 });
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Internal method for Mock Mode. Simulates Meta response and schedules status triggers.
   */
  async _sendMock(whatsappLog, components, fallback) {
    const mockMsgId = `wamid.MOCK_${Math.random().toString(36).substring(2).toUpperCase()}_${Date.now()}`;
    
    whatsappLog.status = 'sent';
    whatsappLog.messageId = mockMsgId;
    whatsappLog.sentAt = new Date();
    whatsappLog.providerResponse = {
      mock: true,
      message: 'Simulated Meta API response',
      fallbackText: fallback
    };

    await whatsappLog.save();
    console.log(`[MOCK WHATSAPP] To: ${whatsappLog.phone} | Template: ${whatsappLog.templateName} | Message: ${fallback}`);

    // Asynchronously simulate delivered and read statuses to test the full lifecycle flow
    setTimeout(async () => {
      try {
        const log = await WhatsAppLog.findById(whatsappLog._id);
        if (log && log.status === 'sent') {
          log.status = 'delivered';
          log.deliveredAt = new Date();
          await log.save();
          console.log(`[MOCK WHATSAPP] Status Update: ${log.phone} -> Delivered (${mockMsgId})`);

          // Wait another 3-5 seconds and transition to READ
          setTimeout(async () => {
            try {
              const finalLog = await WhatsAppLog.findById(log._id);
              if (finalLog && finalLog.status === 'delivered') {
                // 90% read rate, 10% stays delivered to make logs dashboard look realistic
                if (Math.random() < 0.9) {
                  finalLog.status = 'read';
                  finalLog.readAt = new Date();
                  await finalLog.save();
                  console.log(`[MOCK WHATSAPP] Status Update: ${finalLog.phone} -> Read (${mockMsgId})`);
                }
              }
            } catch (err) {
              console.error('Mock status read error:', err.message);
            }
          }, 4000);
        }
      } catch (err) {
        console.error('Mock status delivered error:', err.message);
      }
    }, 2000);

    return whatsappLog;
  }

  /**
   * Core error logging handler.
   */
  async _handleSendError(whatsappLog, errorDetail) {
    console.error(`⚠️ WhatsApp delivery failed for log ${whatsappLog._id}:`, errorDetail.message);
    
    whatsappLog.status = 'failed';
    whatsappLog.errorLogs.push({
      timestamp: new Date(),
      message: errorDetail.message,
      code: errorDetail.code
    });
    whatsappLog.providerResponse = errorDetail;
    await whatsappLog.save();
  }
}

export default new WhatsAppService();
