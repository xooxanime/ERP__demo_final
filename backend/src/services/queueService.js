import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import crypto from 'crypto';
import WhatsAppLog from '../models/WhatsAppLog.js';
import User from '../models/User.js';
import notificationDispatcher from './notificationDispatcher.js';
import AuditLog from '../models/AuditLog.js';
import { 
  whatsappNotificationCounter, 
  deliveryLatencyHistogram, 
  activeJobsGauge, 
  dlqJobsGauge 
} from '../utils/metrics.js';

class VirtualQueueAdapter {
  constructor(workerProcessor) {
    this.jobs = [];
    this.activeJobs = 0;
    this.completedCount = 0;
    this.failedCount = 0;
    this.dlqCount = 0;
    this.processor = workerProcessor;
    this.startWorker();
  }

  async add(name, data, opts = {}) {
    const jobId = `vjob_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    const job = {
      id: jobId,
      name,
      data,
      opts,
      status: opts.delay ? 'delayed' : 'waiting',
      attempts: 0,
      maxRetries: opts.attempts || 5,
      delayUntil: opts.delay ? Date.now() + opts.delay : 0,
      createdAt: new Date()
    };
    this.jobs.push(job);
    return job;
  }

  startWorker() {
    setInterval(async () => {
      const now = Date.now();
      // Find next waiting job or delayed job whose delay is over
      const jobIndex = this.jobs.findIndex(j => 
        j.status === 'waiting' || (j.status === 'delayed' && j.delayUntil <= now)
      );

      if (jobIndex === -1) return;

      const job = this.jobs[jobIndex];
      this.jobs.splice(jobIndex, 1); // remove from queue
      
      job.status = 'active';
      this.activeJobs++;
      job.attempts++;

      try {
        console.log(`[VIRTUAL QUEUE] Processing job ${job.id} (Attempt ${job.attempts}/${job.maxRetries})`);
        await this.processor(job);
        
        job.status = 'completed';
        this.completedCount++;
      } catch (err) {
        console.error(`[VIRTUAL QUEUE] Job ${job.id} failed: ${err.message}`);
        
        if (job.attempts < job.maxRetries) {
          // Exponential backoff retry
          job.status = 'delayed';
          const backoffDelay = 1000 * Math.pow(2, job.attempts);
          job.delayUntil = Date.now() + backoffDelay;
          this.jobs.push(job); // requeue
        } else {
          job.status = 'failed';
          this.failedCount++;
          this.dlqCount++;
          console.error(`[VIRTUAL QUEUE] Job ${job.id} exceeded retries. Moved to DLQ.`);
          // Fire DLQ hooks in DB
          await WhatsAppLog.updateOne(
            { idempotencyKey: job.data.idempotencyKey },
            { $set: { isDLQ: true, status: 'failed', failureReason: err.message } }
          );
        }
      } finally {
        this.activeJobs--;
      }
    }, 500);
  }

  async getCounts() {
    return {
      waiting: this.jobs.filter(j => j.status === 'waiting').length,
      delayed: this.jobs.filter(j => j.status === 'delayed').length,
      active: this.activeJobs,
      completed: this.completedCount,
      failed: this.failedCount,
      dlq: this.dlqCount
    };
  }
}

class QueueService {
  constructor() {
    this.queueName = 'erp-notifications';
    this.redisClient = null;
    this.queue = null;
    this.worker = null;
    this.virtualQueue = null;
    this.connectionMode = 'VIRTUAL';
    this.activeLocks = new Set();
    this.redisErrorLogged = false;
    this.init();
  }

  async init() {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT, 10) || 6379;
    const password = process.env.REDIS_PASSWORD || null;

    try {
      console.log(`🔌 Attempting to connect to Redis at ${host}:${port}...`);
      this.redisClient = new Redis({
        host,
        port,
        password,
        maxRetriesPerRequest: null,
        connectTimeout: 2000
      });

      this.redisClient.on('connect', () => {
        if (this.connectionMode !== 'REDIS') {
          console.log('✅ Redis connection established! Enabling BullMQ...');
          this.connectionMode = 'REDIS';
          this.redisErrorLogged = false;
          this.setupBullMQ();
        }
      });

      this.redisClient.on('error', (err) => {
        if (!this.redisErrorLogged) {
          console.warn(`⚠️ Redis Connection Alert: ${err.message}. Defaulting to Virtual In-Memory queue.`);
          this.redisErrorLogged = true;
        }
        this.connectionMode = 'VIRTUAL';
        this.setupVirtualQueue();
      });

      this.redisClient.on('close', () => {
        if (this.connectionMode === 'REDIS') {
          console.warn('⚠️ Redis Connection Closed. Dynamically switching to Virtual In-Memory Queue.');
          this.connectionMode = 'VIRTUAL';
          this.redisErrorLogged = true;
          this.setupVirtualQueue();
        }
      });

      this.redisClient.on('end', () => {
        if (this.connectionMode === 'REDIS') {
          console.warn('⚠️ Redis Connection Ended. Dynamically switching to Virtual In-Memory Queue.');
          this.connectionMode = 'VIRTUAL';
          this.redisErrorLogged = true;
          this.setupVirtualQueue();
        }
      });
    } catch (err) {
      console.warn(`⚠️ Redis Initialization failed: ${err.message}. Loading Virtual In-Memory queue.`);
      this.setupVirtualQueue();
    }
  }

  setupBullMQ() {
    if (this.queue || this.worker) {
      console.log('🔄 Re-using existing BullMQ Queue and Worker instances.');
      return;
    }

    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT, 10) || 6379;
    const password = process.env.REDIS_PASSWORD || null;
    const connection = { host, port, password };

    this.queue = new Queue(this.queueName, { connection });
    this.worker = new Worker(this.queueName, this.processJob.bind(this), {
      connection,
      concurrency: 5 // Process 5 tasks concurrently
    });

    this.worker.on('failed', async (job, err) => {
      console.error(`❌ BullMQ Job ${job.id} Failed: ${err.message}`);
      if (job.attemptsMade >= job.opts.attempts) {
        await WhatsAppLog.updateOne(
          { idempotencyKey: job.data.idempotencyKey },
          { $set: { isDLQ: true, status: 'failed', failureReason: err.message } }
        );
      }
    });

    this.worker.on('completed', (job) => {
      console.log(`✅ BullMQ Job ${job.id} processed successfully!`);
    });
  }

  setupVirtualQueue() {
    if (!this.virtualQueue) {
      this.connectionMode = 'VIRTUAL';
      this.virtualQueue = new VirtualQueueAdapter(this.processJob.bind(this));
    }
  }

  async processJob(job) {
    const startTime = Date.now();
    const { recipientId, erpEvent, payload, triggerUserId, ipAddress, userAgent, correlationId } = job.data;
    
    try {
      const recipientUser = await User.findById(recipientId);
      if (!recipientUser) {
        throw new Error(`Recipient user ${recipientId} not found in database`);
      }

      console.log(`[Queue Worker] Dispatching channels for Event: ${erpEvent} | Correlation ID: ${correlationId}`);
      
      // Inject event configuration metadata to dispatch
      const notificationPayload = {
        ...payload,
        erpEvent,
        correlationId
      };

      const results = await notificationDispatcher.dispatch(recipientUser, notificationPayload);

      // Save Audit Trail (Immutable Log)
      const activeChannels = results.filter(r => r.success).map(r => r.channel);
      const overallStatus = results.every(r => r.success) ? 'success' : results.some(r => r.success) ? 'partial' : 'failed';

      await AuditLog.create({
        triggerUserId,
        recipientId,
        erpEvent,
        channels: activeChannels,
        payloadSnapshot: payload,
        ipAddress,
        userAgent,
        correlationId,
        status: overallStatus
      });

      // Update status in WhatsApp Logs if whatsapp was dispatched
      const whatsappResult = results.find(r => r.channel === 'whatsapp');
      if (whatsappResult && !whatsappResult.success) {
        throw new Error(whatsappResult.error || 'WhatsApp channel delivery failed');
      }

      // Record metrics latency & counter
      const latency = (Date.now() - startTime) / 1000;
      deliveryLatencyHistogram.observe({ erp_event: erpEvent }, latency);
      whatsappNotificationCounter.inc({ erp_event: erpEvent, status: 'success' });

      return results;
    } catch (err) {
      whatsappNotificationCounter.inc({ erp_event: erpEvent, status: 'failed' });
      throw err;
    }
  }

  async enqueueNotification(jobData) {
    const { recipientId, erpEvent, payload } = jobData;
    
    // Generate deterministic idempotency key
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
    const idempotencyKey = `idemp_${recipientId}_${erpEvent}_${payloadHash}`;

    // 1. Synchronous lock check to prevent concurrent race conditions
    if (this.activeLocks.has(idempotencyKey)) {
      console.log(`⏭️ Synchronous Deduplication Shield: Job skipped for key: ${idempotencyKey}`);
      return { skipped: true, idempotencyKey };
    }

    // Set lock
    this.activeLocks.add(idempotencyKey);

    try {
      // 2. Persistent DB Deduplication check
      const existingLog = await WhatsAppLog.findOne({ idempotencyKey });
      if (existingLog && ['pending', 'sent', 'delivered', 'read'].includes(existingLog.status)) {
        console.log(`⏭️ Persistent DB Deduplication: Job skipped for key: ${idempotencyKey}`);
        return { skipped: true, idempotencyKey };
      }

      // Set correlation ID
      const correlationId = jobData.correlationId || `corr_${Math.random().toString(36).substring(2)}_${Date.now()}`;
      const enrichedJobData = {
        ...jobData,
        idempotencyKey,
        correlationId
      };

      // 3. Pre-create pending log in DB to lock persistent check
      let phone = 'Unknown';
      let templateName = erpEvent;
      if (payload && payload.templateData) {
        phone = payload.templateData.phone || phone;
        templateName = payload.templateData.templateName || templateName;
      }
      
      await WhatsAppLog.create({
        recipientId,
        phone,
        templateName,
        erpEvent,
        idempotencyKey,
        correlationId,
        status: 'pending'
      });

      if (this.connectionMode === 'REDIS' && this.queue) {
        // BullMQ enqueue
        const job = await this.queue.add(erpEvent, enrichedJobData, {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: true,
          removeOnFail: false
        });
        return { success: true, jobId: job.id, idempotencyKey, correlationId };
      } else {
        // Virtual Queue enqueue
        this.setupVirtualQueue();
        const job = await this.virtualQueue.add(erpEvent, enrichedJobData, {
          attempts: 5
        });
        return { success: true, jobId: job.id, idempotencyKey, correlationId };
      }
    } catch (err) {
      this.activeLocks.delete(idempotencyKey);
      throw err;
    } finally {
      // Defer lock release slightly to bridge asynchronous DB gaps
      setTimeout(() => {
        this.activeLocks.delete(idempotencyKey);
      }, 1000);
    }
  }

  /**
   * Fetch queue status logs for admin console.
   */
  async getStats() {
    if (this.connectionMode === 'REDIS' && this.queue) {
      const [waiting, active, delayed, failed, completed] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getDelayedCount(),
        this.queue.getFailedCount(),
        this.queue.getCompletedCount()
      ]);
      const dlq = await WhatsAppLog.countDocuments({ isDLQ: true });
      
      // Update Prometheus Gauges
      activeJobsGauge.set(active);
      dlqJobsGauge.set(dlq);

      return {
        mode: 'REDIS',
        waiting,
        active,
        delayed,
        failed,
        completed,
        dlq
      };
    } else {
      this.setupVirtualQueue();
      const virtualStats = await this.virtualQueue.getCounts();
      const dlq = await WhatsAppLog.countDocuments({ isDLQ: true });
      
      // Update Prometheus Gauges
      activeJobsGauge.set(virtualStats.active);
      dlqJobsGauge.set(dlq || virtualStats.dlq);

      return {
        mode: 'VIRTUAL_MEMORY',
        waiting: virtualStats.waiting,
        active: virtualStats.active,
        delayed: virtualStats.delayed,
        failed: virtualStats.failed,
        completed: virtualStats.completed,
        dlq: dlq || virtualStats.dlq
      };
    }
  }

  /**
   * Gracefully close connections and active workers.
   */
  async shutdown() {
    console.log('🛑 Gracefully shutting down Queue service workers...');
    try {
      if (this.worker) {
        await this.worker.close();
      }
      if (this.queue) {
        await this.queue.close();
      }
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      console.log('✅ Queue service cleanup complete.');
    } catch (err) {
      console.error('⚠️ Queue service shutdown error:', err.message);
    }
  }
}

const queueService = new QueueService();

// Bind process event handlers for graceful termination
process.on('SIGTERM', async () => {
  await queueService.shutdown();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await queueService.shutdown();
  process.exit(0);
});

export default queueService;
