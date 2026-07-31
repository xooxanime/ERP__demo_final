import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const admin = await User.findOne({ email: 'admin@caelearning.com' }).select('+password');
    
    if (admin) {
      console.log('\n✅ Admin user found!');
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Role:', admin.role);
      console.log('Password Hash:', admin.password.substring(0, 20) + '...');
      console.log('Is Active:', admin.isActive);
      
      // Test password comparison
      const bcrypt = await import('bcryptjs');
      const isMatch = await bcrypt.default.compare('Admin@123', admin.password);
      console.log('\n🔐 Password Test:');
      console.log('Password "Admin@123" matches:', isMatch ? '✅ YES' : '❌ NO');
      
    } else {
      console.log('❌ Admin user not found!');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdmin();
