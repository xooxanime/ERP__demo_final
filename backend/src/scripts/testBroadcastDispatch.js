import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import NotificationBroadcast from '../models/NotificationBroadcast.js';
import notificationService from '../services/notificationService.js';
import WhatsAppLog from '../models/WhatsAppLog.js';

dotenv.config();

const test = async () => {
  try {
    await connectDB();
    console.log('🔄 Resolving parent1...');
    const parent = await User.findOne({ email: 'parent1@shri.com' });
    if (!parent) {
      console.error('❌ parent1@shri.com not found');
      return;
    }
    console.log(`👤 Found parent: ${parent.name}, Phone: ${parent.phone}`);

    console.log('📢 Creating a test global announcement broadcast...');
    const broadcast = await NotificationBroadcast.create({
      senderId: new mongoose.Types.ObjectId(), // mock admin
      senderName: 'Test Admin',
      senderRole: 'admin',
      title: '🚨 Test Global Announcement',
      message: 'Hello, this is a test global announcement broadcast with **markdown** formatting! Please download the attachment if present.',
      type: 'info',
      priority: 'high',
      section: 'system',
      audienceScope: 'all',
      status: 'queued'
    });

    console.log(`✅ Broadcast created with ID: ${broadcast._id}. Processing fan-out...`);
    await notificationService.processBroadcast(broadcast);

    // Wait a longer moment for virtual queue worker processing
    console.log('⏳ Waiting 15 seconds for queue worker and mock status transitions...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('\n📊 Fetching Outbound WhatsApp Logs for the parent...');
    const logs = await WhatsAppLog.find({ recipientId: parent._id }).sort({ createdAt: -1 }).limit(3);
    if (logs.length === 0) {
      console.log('❌ No WhatsApp logs found for this parent.');
    } else {
      logs.forEach((log, index) => {
        console.log(`\n--- Log #${index + 1} ---`);
        console.log(`ID: ${log._id}`);
        console.log(`Phone: ${log.phone}`);
        console.log(`Template: ${log.templateName}`);
        console.log(`Status: ${log.status}`);
        console.log(`Provider Response:`, JSON.stringify(log.providerResponse, null, 2));
      });
    }

    console.log('🎉 Test run completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
};

test();
