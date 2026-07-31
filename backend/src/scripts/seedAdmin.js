import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Delete existing admin if exists
    await User.deleteMany({ email: 'abhaypratapmishra5678@gmail.com' });

    console.log('🗑️  Deleted old admin users');

    // Create new admin user with requested credentials
    const admin = await User.create({
      name: 'Admin User',
      email: 'abhaypratapmishra5678@gmail.com',
      phone: '9999999999',
      password: 'Abhay1230!@',
      role: 'admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: abhaypratapmishra5678@gmail.com');
    console.log('🔑 Password: Abhay1230!@');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
