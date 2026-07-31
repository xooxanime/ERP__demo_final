import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  triggerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  erpEvent: {
    type: String,
    required: true,
    index: true
  },
  channels: [{
    type: String
  }],
  payloadSnapshot: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  correlationId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  timestamps: false // Immutable logs do not need updatedAt
});

// Enforce immutability at the Mongoose level
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('AuditLog records are immutable and cannot be updated'));
  }
  next();
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Dynamic TTL Index initialization
mongoose.connection.once('open', async () => {
  try {
    const auditDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS, 10) || 90;
    const auditSecs = auditDays * 24 * 60 * 60;
    
    try {
      await AuditLog.collection.createIndex({ createdAt: 1 }, { name: 'audit_log_ttl_index', expireAfterSeconds: auditSecs });
      console.log(`✅ AuditLog TTL index initialized with ${auditDays}-day retention.`);
    } catch (err) {
      if (err.code === 85 || err.message.includes('IndexOptionsConflict')) {
        console.log('🔄 Re-creating AuditLog TTL index with updated retention duration...');
        await AuditLog.collection.dropIndex('audit_log_ttl_index');
        await AuditLog.collection.createIndex({ createdAt: 1 }, { name: 'audit_log_ttl_index', expireAfterSeconds: auditSecs });
      } else {
        console.error('⚠️ Failed to create AuditLog TTL index:', err.message);
      }
    }
  } catch (err) {
    console.error('⚠️ Error initializing AuditLog TTL index:', err.message);
  }
});

export default AuditLog;
