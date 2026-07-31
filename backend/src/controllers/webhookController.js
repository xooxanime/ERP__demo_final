import crypto from 'crypto';
import WhatsAppLog from '../models/WhatsAppLog.js';

/**
 * Verifies the integrity of Meta Webhook payloads using HMAC-SHA256 signature checking.
 */
export const verifyMetaSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // Skip signature verification if secret is not set (useful for local development and testing)
  if (!appSecret) {
    return next();
  }

  if (!signature) {
    return res.status(401).json({ status: 'error', message: 'Missing webhook signature header' });
  }

  try {
    const payload = req.rawBody ? req.rawBody : JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', appSecret);
    const computedSignature = `sha256=${hmac.update(payload).digest('hex')}`;

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))) {
      return next();
    } else {
      console.warn('⚠️ Webhook Signature Mismatch: Request aborted');
      return res.status(401).json({ status: 'error', message: 'Signature verification failed' });
    }
  } catch (err) {
    console.error('Webhook signature validation error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Internal signature validator error' });
  }
};

/**
 * Meta GET challenge route for webhook verification setup.
 */
export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const localVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'erp_whatsapp_verification_token_key_123';

  if (mode && token) {
    if (mode === 'subscribe' && token === localVerifyToken) {
      console.log('✅ Meta Webhook Verification Successful!');
      return res.status(200).send(challenge);
    } else {
      console.warn('⚠️ hub.verify_token validation failed during Meta subscription handshake');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
};

/**
 * Meta POST webhook to handle delivery status tracking updates.
 */
export const handleWebhook = async (req, res) => {
  try {
    const { body } = req;

    // Check if this is a message status update payload from Meta
    if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.statuses) {
      const statuses = body.entry[0].changes[0].value.statuses;

      for (const metaStatus of statuses) {
        const { id: messageId, status: newStatus, timestamp, errors } = metaStatus;

        // Perform idempotent find and update of our WhatsAppLog
        const log = await WhatsAppLog.findOne({ messageId });
        if (log) {
          const timestampDate = timestamp ? new Date(Number(timestamp) * 1000) : new Date();

          // Only update state if it is forward-progressing in the status lifecycle:
          // pending -> sent -> delivered -> read
          const statusRank = { pending: 0, sent: 1, delivered: 2, read: 3, failed: 4 };
          
          if (statusRank[newStatus] > statusRank[log.status]) {
            log.status = newStatus;

            if (newStatus === 'delivered') {
              log.deliveredAt = timestampDate;
            } else if (newStatus === 'read') {
              log.readAt = timestampDate;
            } else if (newStatus === 'failed') {
              if (errors && errors.length > 0) {
                for (const err of errors) {
                  log.errorLogs.push({
                    timestamp: new Date(),
                    message: err.message,
                    code: err.code
                  });
                }
              }
            }

            await log.save();
            console.log(`📡 Webhook Update: Status for MsgId ${messageId} changed to "${newStatus}"`);
          }
        } else {
          console.warn(`📡 Webhook Status Warning: Log message record not found in system for Message ID: ${messageId}`);
        }
      }
    }

    // Always respond to Meta with 200 OK
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('❌ Error handling Meta Webhook callback payload:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
