import client from 'prom-client';

// Enable default system metrics collection (CPU, Memory, etc.)
client.collectDefaultMetrics();

// Define custom metrics
export const whatsappNotificationCounter = new client.Counter({
  name: 'erp_whatsapp_notifications_total',
  help: 'Total number of WhatsApp notifications enqueued',
  labelNames: ['erp_event', 'status']
});

export const deliveryLatencyHistogram = new client.Histogram({
  name: 'erp_whatsapp_delivery_latency_seconds',
  help: 'Latency of WhatsApp message sends in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  labelNames: ['erp_event']
});

export const apiErrorsCounter = new client.Counter({
  name: 'erp_whatsapp_api_errors_total',
  help: 'Total number of Meta Cloud API request errors',
  labelNames: ['erp_event', 'error_code']
});

export const activeJobsGauge = new client.Gauge({
  name: 'erp_notification_queue_active_jobs',
  help: 'Current active notification jobs in worker'
});

export const dlqJobsGauge = new client.Gauge({
  name: 'erp_notification_queue_dlq_jobs',
  help: 'Current failed notification jobs in Dead Letter Queue (DLQ)'
});

export const getMetrics = async () => {
  return await client.register.metrics();
};

export const getContentType = () => {
  return client.register.contentType;
};
