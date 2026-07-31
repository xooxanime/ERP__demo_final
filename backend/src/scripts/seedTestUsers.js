import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedTestUsers = async () => {
  try {
    await connectDB();

    // Delete existing test users
    await User.deleteMany({ email: { $in: ['teacher@shri.com', 'parent@shri.com'] } });
    await ApprovalRequest.deleteMany({ email: { $in: ['teacher@shri.com', 'parent@shri.com'] } });

    console.log('🗑️  Deleted old test users');

    // Create test teacher user
    const teacher = await User.create({
      name: 'Demo Teacher',
      email: 'teacher@shri.com',
      phone: '9876543210',
      password: 'Teacher@123',
      role: 'teacher',
      approvalStatus: 'pending'
    });

    const teacherRequest = await ApprovalRequest.create({
      userId: teacher._id,
      email: 'teacher@shri.com',
      name: 'Demo Teacher',
      phone: '9876543210',
      requestedRole: 'teacher',
      status: 'pending',
      teacherInfo: {
        qualifications: 'B.Tech, M.Tech',
        experience: '5 years',
        specialization: 'Mathematics & Physics',
        department: 'Science'
      }
    });

    teacher.approvalRequest = teacherRequest._id;
    await teacher.save();

    // Create test parent user
    const parent = await User.create({
      name: 'Demo Parent',
      email: 'parent@shri.com',
      phone: '9999888777',
      password: 'Parent@123',
      role: 'parent',
      approvalStatus: 'pending'
    });

    const parentRequest = await ApprovalRequest.create({
      userId: parent._id,
      email: 'parent@shri.com',
      name: 'Demo Parent',
      phone: '9999888777',
      requestedRole: 'parent',
      status: 'pending',
      parentInfo: {
        studentName: 'Demo Student',
        studentEmail: 'student@shri.com',
        relationship: 'father'
      }
    });

    parent.approvalRequest = parentRequest._id;
    await parent.save();

    console.log('✅ Test users created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍🏫 TEACHER TEST ACCOUNT');
    console.log('Email:    teacher@shri.com');
    console.log('Password: Teacher@123');
    console.log('Status:   Pending Approval');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍👩‍👧 PARENT TEST ACCOUNT');
    console.log('Email:    parent@shri.com');
    console.log('Password: Parent@123');
    console.log('Status:   Pending Approval');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ Login with these credentials, select your role, and submit for approval!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
};

seedTestUsers();
