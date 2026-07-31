import mongoose from 'mongoose';

const whatsappLogSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  erpEvent: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    index: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  providerResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  retries: {
    type: Number,
    default: 0
  },
  errorLogs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String,
    code: Number
  }],
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  isDLQ: {
    type: Boolean,
    default: false,
    index: true
  },
  failureReason: {
    type: String
  },
  correlationId: {
    type: String,
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for optimized logs loading and searching
whatsappLogSchema.index({ recipientId: 1, createdAt: -1 });
whatsappLogSchema.index({ phone: 1, createdAt: -1 });

const WhatsAppLog = mongoose.model('WhatsAppLog', whatsappLogSchema);

// Dynamic TTL Index initialization
mongoose.connection.once('open', async () => {
  try {
    const whatsappDays = parseInt(process.env.WHATSAPP_LOG_RETENTION_DAYS, 10) || 90;
    const whatsappSecs = whatsappDays * 24 * 60 * 60;
    
    try {
      await WhatsAppLog.collection.createIndex({ createdAt: 1 }, { name: 'whatsapp_log_ttl_index', expireAfterSeconds: whatsappSecs });
      console.log(`✅ WhatsAppLog TTL index initialized with ${whatsappDays}-day retention.`);
    } catch (err) {
      if (err.code === 85 || err.message.includes('IndexOptionsConflict')) {
        console.log('🔄 Re-creating WhatsAppLog TTL index with updated retention duration...');
        await WhatsAppLog.collection.dropIndex('whatsapp_log_ttl_index');
        await WhatsAppLog.collection.createIndex({ createdAt: 1 }, { name: 'whatsapp_log_ttl_index', expireAfterSeconds: whatsappSecs });
      } else {
        console.error('⚠️ Failed to create WhatsAppLog TTL index:', err.message);
      }
    }
  } catch (err) {
    console.error('⚠️ Error initializing WhatsAppLog TTL index:', err.message);
  }
});

export default WhatsAppLog;
