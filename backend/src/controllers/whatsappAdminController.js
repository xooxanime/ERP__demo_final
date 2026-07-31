import mongoose from 'mongoose';
import WhatsAppLog from '../models/WhatsAppLog.js';
import User from '../models/User.js';
import whatsappService, { isMockMode } from '../services/whatsappService.js';
import { buildTemplate, whatsappTemplates } from '../services/templates/whatsappTemplates.js';
import WhatsAppTemplate from '../models/WhatsAppTemplate.js';
import AuditLog from '../models/AuditLog.js';
import queueService from '../services/queueService.js';
import circuitBreaker from '../services/circuitBreaker.js';

/**
 * GET /api/admin/whatsapp/logs
 * Fetches logs with sorting, pagination, and filter queries.
 */
export const getWhatsAppLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.erpEvent) {
      query.erpEvent = req.query.erpEvent;
    }
    if (req.query.phone) {
      const escapedPhone = req.query.phone.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.phone = new RegExp(escapedPhone, 'i');
    }
    if (req.query.isDLQ) {
      query.isDLQ = req.query.isDLQ === 'true';
    }

    const logs = await WhatsAppLog.find(query)
      .populate('recipientId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WhatsAppLog.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * GET /api/admin/whatsapp/stats
 * Aggregates statistics for the dashboard dashboard charts.
 */
export const getWhatsAppStats = async (req, res) => {
  try {
    const stats = await WhatsAppLog.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      total: 0,
      pending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0
    };

    stats.forEach(item => {
      counts[item._id] = item.count;
      counts.total += item.count;
    });

    // Calculate rates
    const deliveredRate = counts.total > 0 ? ((counts.delivered + counts.read) / counts.total) * 100 : 0;
    const readRate = (counts.delivered + counts.read) > 0 ? (counts.read / (counts.delivered + counts.read)) * 100 : 0;
    const failedRate = counts.total > 0 ? (counts.failed / counts.total) * 100 : 0;

    // Get volume counts by event type
    const eventStats = await WhatsAppLog.aggregate([
      {
        $group: {
          _id: '$erpEvent',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary: counts,
        rates: {
          deliveredRate: parseFloat(deliveredRate.toFixed(2)),
          readRate: parseFloat(readRate.toFixed(2)),
          failedRate: parseFloat(failedRate.toFixed(2))
        },
        topEvents: eventStats
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * GET /api/admin/whatsapp/config
 * Resolves current settings flags, mock/live indicators, and verify tokens.
 */
export const getWhatsAppConfig = async (req, res) => {
  try {
    const host = req.get('host') || 'localhost:10000';
    const protocol = req.secure ? 'https' : 'http';

    const config = {
      enabled: whatsappService.isEnabled(),
      connectionMode: isMockMode() ? 'MOCK' : 'LIVE',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v19.0',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Configured (Masked)' : 'Missing',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN ? 'Configured (Masked)' : 'Missing',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'erp_whatsapp_verification_token_key_123',
      defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '+91',
      webhookUrl: `${protocol}://${host}/api/whatsapp/webhook`,
      circuitBreaker: circuitBreaker.getStatus()
    };

    res.status(200).json({
      status: 'success',
      data: config
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * POST /api/admin/whatsapp/test
 * Sends a manual test notification to a recipient number.
 */
export const sendTestWhatsAppMessage = async (req, res) => {
  try {
    const { phone, erpEvent, testName } = req.body;

    if (!phone || !erpEvent) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide phone and erpEvent parameters'
      });
    }

    // Try finding matching user by phone, or fabricate a temp testing User object
    let recipientUser = await User.findOne({ phone });
    if (!recipientUser) {
      recipientUser = {
        _id: new mongoose.Types.ObjectId(),
        name: testName || 'Testing Recipient',
        phone,
        role: 'student'
      };
    }

    // Set sample payload inputs based on event type
    const testData = {
      name: recipientUser.name,
      courseName: 'CA Foundation Masterclass',
      teacherName: 'Mentor Harish Kumar',
      date: 'Tomorrow',
      time: '11:00 AM',
      meetingLink: 'https://meet.jit.si/ca-elearning-test-room',
      amount: '5000',
      dueDate: 'July 15, 2026',
      receiptId: 'TXN-982390',
      assignmentTitle: 'Income Tax Assessment Chapter 3',
      deadline: 'July 5, 2026',
      percentage: '65',
      message: 'This is a test broadcast notification from Admin Center.'
    };

    const templateConfig = buildTemplate(erpEvent, testData);

    const logRecord = await whatsappService.sendTemplateMessage(
      recipientUser,
      erpEvent,
      templateConfig
    );

    if (logRecord) {
      res.status(200).json({
        status: 'success',
        message: 'WhatsApp message triggered successfully',
        data: logRecord
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Could not send message. Verify WhatsApp enabled configuration.'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * GET /api/admin/whatsapp/queue-stats
 * Retrieves live metrics from Redis/BullMQ or virtual memory adapter.
 */
export const getQueueStats = async (req, res) => {
  try {
    const stats = await queueService.getStats();
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * POST /api/admin/whatsapp/dlq/reprocess/:id
 * Reprocesses a single DLQ job.
 */
export const reprocessDLQJob = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await WhatsAppLog.findById(id);
    
    if (!log || !log.isDLQ) {
      return res.status(404).json({
        status: 'error',
        message: 'Failed DLQ log not found or not in Dead Letter Queue'
      });
    }

    const recipient = await User.findById(log.recipientId);
    if (!recipient) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipient user not found'
      });
    }

    // Reset log flags to re-queue
    log.isDLQ = false;
    log.status = 'pending';
    log.attempts = 0;
    log.failureReason = undefined;
    await log.save();

    // Re-queue inside QueueService
    const jobData = {
      recipientId: log.recipientId,
      erpEvent: log.erpEvent,
      correlationId: log.correlationId,
      payload: {
        title: `Retry Transaction Alert`,
        message: `System reprocessing transaction message`,
        templateData: {
          phone: log.phone,
          templateName: log.templateName
        }
      }
    };

    const queueRes = await queueService.enqueueNotification(jobData);
    
    res.status(200).json({
      status: 'success',
      message: 'DLQ job re-queued successfully',
      data: queueRes
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * POST /api/admin/whatsapp/dlq/reprocess
 * Reprocesses all DLQ jobs.
 */
export const bulkReprocessDLQ = async (req, res) => {
  try {
    const logs = await WhatsAppLog.find({ isDLQ: true });
    
    let count = 0;
    for (const log of logs) {
      log.isDLQ = false;
      log.status = 'pending';
      log.attempts = 0;
      log.failureReason = undefined;
      await log.save();

      const jobData = {
        recipientId: log.recipientId,
        erpEvent: log.erpEvent,
        correlationId: log.correlationId,
        payload: {
          title: `Bulk Reprocess Transaction Alert`,
          message: `System reprocessing transaction message`,
          templateData: {
            phone: log.phone,
            templateName: log.templateName
          }
        }
      };
      await queueService.enqueueNotification(jobData);
      count++;
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully re-queued ${count} failed jobs`
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * DELETE /api/admin/whatsapp/dlq/:id
 * Deletes a single DLQ log.
 */
export const deleteDLQJob = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await WhatsAppLog.deleteOne({ _id: id, isDLQ: true });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Failed DLQ log not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'DLQ job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * DELETE /api/admin/whatsapp/dlq
 * Deletes all DLQ logs.
 */
export const bulkDeleteDLQ = async (req, res) => {
  try {
    const result = await WhatsAppLog.deleteMany({ isDLQ: true });
    res.status(200).json({
      status: 'success',
      message: `Deleted all ${result.deletedCount} DLQ logs`
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * GET /api/admin/whatsapp/templates
 * Fetches templates from Mongoose DB. Bootstraps if empty.
 */
export const getWhatsAppTemplates = async (req, res) => {
  try {
    const count = await WhatsAppTemplate.countDocuments();
    
    if (count === 0) {
      // Bootstrap from templates registry constants
      const records = [];
      for (const [key, handler] of Object.entries(whatsappTemplates)) {
        // Build mock input data to evaluate the template structure
        const dummyConfig = handler({
          name: '{{1}}', role: '{{2}}', email: '{{3}}',
          courseName: '{{1}}', teacherName: '{{2}}',
          date: '{{3}}', time: '{{4}}', meetingLink: '{{5}}',
          amount: '{{2}}', dueDate: '{{3}}', link: '{{4}}',
          receiptId: '{{4}}', title: '{{1}}', message: '{{2}}'
        });

        records.push({
          templateName: key,
          version: 1,
          language: dummyConfig.language || 'en_US',
          components: dummyConfig.components || [],
          fallbackText: dummyConfig.fallback || 'Template fallback text placeholder',
          isActive: true
        });
      }
      await WhatsAppTemplate.insertMany(records);
      console.log('✅ Bootstrapped WhatsApp Templates in Mongoose DB');
    }

    const templates = await WhatsAppTemplate.find().sort({ templateName: 1, version: -1 });
    res.status(200).json({
      status: 'success',
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * POST /api/admin/whatsapp/templates/version
 * Creates a new version for a template.
 */
export const createWhatsAppTemplateVersion = async (req, res) => {
  try {
    const { templateName, language, components, fallbackText } = req.body;
    
    if (!templateName || !fallbackText) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide templateName and fallbackText'
      });
    }

    // Get current max version
    const lastVersion = await WhatsAppTemplate.findOne({ templateName }).sort({ version: -1 });
    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    // Set old versions to inactive
    await WhatsAppTemplate.updateMany({ templateName }, { $set: { isActive: false } });

    const newTemplate = await WhatsAppTemplate.create({
      templateName,
      version: nextVersion,
      language: language || 'en_US',
      components: components || [],
      fallbackText,
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      message: `Template version ${nextVersion} created and marked active`,
      data: newTemplate
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * PATCH /api/admin/whatsapp/templates/:id/toggle
 * Toggle active state or select version.
 */
export const toggleWhatsAppTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await WhatsAppTemplate.findById(id);
    
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }

    // Toggle active state
    template.isActive = !template.isActive;
    await template.save();

    // If toggled to active, make all other versions of the same template inactive
    if (template.isActive) {
      await WhatsAppTemplate.updateMany(
        { templateName: template.templateName, _id: { $ne: template._id } },
        { $set: { isActive: false } }
      );
    }

    res.status(200).json({
      status: 'success',
      message: `Template toggle status updated`,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
