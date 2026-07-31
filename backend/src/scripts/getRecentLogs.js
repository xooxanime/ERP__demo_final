import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import WhatsAppLog from '../models/WhatsAppLog.js';
import NotificationBroadcast from '../models/NotificationBroadcast.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log('--- RECENT ANNOUNCEMENT BROADCASTS ---');
    const broadcasts = await NotificationBroadcast.find().sort({ createdAt: -1 }).limit(5);
    broadcasts.forEach((b) => {
      console.log(`Title: ${b.title}`);
      console.log(`Audience Scope: ${b.audienceScope}`);
      console.log(`Status: ${b.status}`);
      console.log(`Sender: ${b.senderName} (${b.senderRole})`);
      console.log(`Created At: ${b.createdAt}\n`);
    });

    console.log('--- RECENT WHATSAPP LOGS ---');
    const logs = await WhatsAppLog.find().sort({ createdAt: -1 }).limit(10);
    logs.forEach((l) => {
      console.log(`To: ${l.phone}`);
      console.log(`Template: ${l.templateName}`);
      console.log(`Status: ${l.status}`);
      console.log(`Is DLQ: ${l.isDLQ}`);
      console.log(`Response:`, JSON.stringify(l.providerResponse));
      console.log(`Created At: ${l.createdAt}\n`);
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
