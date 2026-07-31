import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';
import WhatsAppLog from '../models/WhatsAppLog.js';
import Notification from '../models/Notification.js';

dotenv.config();

const runTest = async () => {
  try {
    console.log('🚀 Starting WhatsApp Notification Pipeline Test Script...');
    await connectDB();

    // 1. Fetch or create a test recipient
    let testUser = await User.findOne({ email: 'abhaypratapmishra5678@gmail.com' });
    if (!testUser) {
      console.log('👤 Creating temporary test user...');
      testUser = await User.create({
        name: 'Abhay Pratap Mishra',
        email: 'abhaypratapmishra5678@gmail.com',
        phone: '9870413252',
        password: 'Abhay1230!@',
        role: 'admin'
      });
    } else {
      console.log(`👤 Found test user: ${testUser.name} (${testUser.phone})`);
    }

    // Reset old logs for a clean test run
    await WhatsAppLog.deleteMany({ recipientId: testUser._id });
    await Notification.deleteMany({ recipient: testUser._id });
    console.log('🗑️ Cleared previous test logs.');

    // 2. Trigger Welcome Verification event
    console.log('\n📣 Event 1: Triggering welcome_verification...');
    await notificationService.notify(testUser, 'welcome_verification', {
      role: testUser.role
    });

    // 3. Trigger Live Class Scheduled event
    console.log('\n📣 Event 2: Triggering live_class_scheduled...');
    await notificationService.notify(testUser, 'live_class_scheduled', {
      courseName: 'CA Inter Auditing Masterclass',
      teacherName: 'CA Harish Mehta',
      date: 'July 5, 2026',
      time: '10:00 AM',
      meetingLink: 'https://meet.jit.si/ca-auditing-masterclass'
    });

    // 4. Trigger Fee Payment Confirmation event
    console.log('\n📣 Event 3: Triggering payment_success...');
    await notificationService.notify(testUser, 'payment_success', {
      courseName: 'CA Inter Auditing Masterclass',
      amount: '18000',
      receiptId: 'TXN-982104UTR'
    });

    // 5. Trigger Low Attendance Alert
    console.log('\n📣 Event 4: Triggering low_attendance_warning...');
    await notificationService.notify(testUser, 'low_attendance_warning', {
      courseName: 'CA Inter Auditing Masterclass',
      percentage: '68'
    });

    // 6. Give Mock Mode asynchronous handlers 3 seconds to complete delivered/read state changes
    console.log('\n⏳ Waiting 3 seconds for mock delivery status updates to settle...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 7. Verify persistent logs
    console.log('\n🔎 Retrieving generated In-App Notifications:');
    const dbNotifs = await Notification.find({ recipient: testUser._id });
    dbNotifs.forEach(n => {
      console.log(`- In-App Alerts DB: [${n.type}] "${n.title}": ${n.message}`);
    });

    console.log('\n🔎 Retrieving generated WhatsApp Log entries:');
    const waLogs = await WhatsAppLog.find({ recipientId: testUser._id });
    waLogs.forEach(log => {
      console.log(`- WhatsApp Log DB: Status: [${log.status}] | Event: ${log.erpEvent} | Template: ${log.templateName} | Phone: ${log.phone} | MsgId: ${log.messageId}`);
    });

    console.log('\n======================================================');
    console.log('✅ WhatsApp Notification Pipeline E2E Verification Complete!');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ E2E test script failed:', error);
    process.exit(1);
  }
};

runTest();
