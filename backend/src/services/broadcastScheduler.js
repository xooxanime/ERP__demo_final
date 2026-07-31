import NotificationBroadcast from '../models/NotificationBroadcast.js';
import notificationService from './notificationService.js';

let intervalId = null;

export const startBroadcastScheduler = () => {
  if (intervalId) return;

  console.log('⏰ Starting Notification Broadcast Scheduler (checks every 30 seconds)...');
  intervalId = setInterval(async () => {
    try {
      // Find all broadcasts that are scheduled and due
      const dueBroadcasts = await NotificationBroadcast.find({
        status: 'scheduled',
        scheduledAt: { $lte: new Date() }
      });

      for (const broadcast of dueBroadcasts) {
        console.log(`📡 Broadcast Scheduler: Processing due broadcast "${broadcast.title}" (ID: ${broadcast._id})`);
        
        // Update status to prevent double processing
        broadcast.status = 'queued';
        await broadcast.save();

        // Run fan-out in background
        setImmediate(async () => {
          try {
            await notificationService.processBroadcast(broadcast);
          } catch (err) {
            console.error(`❌ Broadcast Scheduler: Failed to process broadcast ${broadcast._id}:`, err);
          }
        });
      }
    } catch (error) {
      console.error('❌ Broadcast Scheduler Error:', error.message);
    }
  }, 30000);
};

export const stopBroadcastScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🛑 Stopped Notification Broadcast Scheduler.');
  }
};
