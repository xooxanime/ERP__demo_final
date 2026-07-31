import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedAllUsers = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting to seed all users...\n');

    // Delete existing test users
    await User.deleteMany({ 
      email: { 
        $in: [
          'admin@shri.com',
          'teacher@shri.com',
          'student@shri.com'
        ] 
      } 
    });

    console.log('🗑️  Deleted old test users\n');

    // Create Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@shri.com',
      phone: '9999999999',
      password: 'Admin@123',
      role: 'admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@shri.com');
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role: ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Create Teacher User
    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher@shri.com',
      phone: '8888888888',
      password: 'Teacher@123',
      role: 'teacher'
    });

    console.log('✅ Teacher user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: teacher@shri.com');
    console.log('🔑 Password: Teacher@123');
    console.log('👤 Role: TEACHER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Create Student User
    const student = await User.create({
      name: 'Student User',
      email: 'student@shri.com',
      phone: '7777777777',
      password: 'Student@123',
      role: 'student'
    });

    console.log('✅ Student user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: student@shri.com');
    console.log('🔑 Password: Student@123');
    console.log('👤 Role: STUDENT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ All users seeded successfully!\n');
    console.log('🎯 You can now login with any of these credentials:\n');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│         ADMIN DASHBOARD                 │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ Email:    admin@shri.com                │');
    console.log('│ Password: Admin@123                     │');
    console.log('└─────────────────────────────────────────┘\n');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│         TEACHER DASHBOARD               │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ Email:    teacher@shri.com              │');
    console.log('│ Password: Teacher@123                   │');
    console.log('└─────────────────────────────────────────┘\n');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│         STUDENT DASHBOARD               │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ Email:    student@shri.com              │');
    console.log('│ Password: Student@123                   │');
    console.log('└─────────────────────────────────────────┘\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedAllUsers();
