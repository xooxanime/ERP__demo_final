import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StudentFeeLedger from '../models/StudentFeeLedger.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

try {
  const student = await User.findOne({ email: 'student1@shri.com' });
  const ledgers = await StudentFeeLedger.find({ studentId: student._id });
  console.log('Ledgers for Aarav Sharma:');
  console.log(JSON.stringify(ledgers, null, 2));

  const payments = await Payment.find({ studentId: student._id });
  console.log('\nPayments for Aarav Sharma:');
  console.log(JSON.stringify(payments, null, 2));
} catch (err) {
  console.error(err);
} finally {
  await mongoose.disconnect();
}
