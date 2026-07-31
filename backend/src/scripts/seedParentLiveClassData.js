import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import LiveClass from '../models/LiveClass.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedParentData = async () => {
  try {
    await connectDB();
    console.log('🌱 Connected to MongoDB for seeding Parent Live Classes test data...');

    // 1. Get or create test student
    let student = await User.findOne({ email: 'student@shri.com' });
    if (!student) {
      console.log('🔄 Student student@shri.com not found, creating one...');
      student = await User.create({
        name: 'Student User',
        email: 'student@shri.com',
        phone: '7777777777',
        password: 'Student@123',
        role: 'student',
        approvalStatus: 'approved'
      });
    } else {
      student.approvalStatus = 'approved';
      await student.save();
    }
    console.log(`✅ Student configured: ${student.name} (${student.email})`);

    // 2. Get or create test parent, approved and linked to student
    let parent = await User.findOne({ email: 'parent@shri.com' });
    if (parent) {
      await User.deleteOne({ email: 'parent@shri.com' });
    }
    
    parent = await User.create({
      name: 'Parent User',
      email: 'parent@shri.com',
      phone: '9999888777',
      password: 'Parent@123',
      role: 'parent',
      approvalStatus: 'approved',
      parentInfo: {
        studentId: student._id,
        studentName: student.name,
        relationship: 'father'
      }
    });
    console.log(`✅ Approved Parent configured: ${parent.name} (${parent.email}) linked to student: ${student.name}`);

    // 3. Get or create a teacher
    let teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.log('🔄 Teacher not found, creating one...');
      teacher = await User.create({
        name: 'Teacher User',
        email: 'teacher@shri.com',
        phone: '8888888888',
        password: 'Teacher@123',
        role: 'teacher',
        approvalStatus: 'approved'
      });
    } else {
      teacher.approvalStatus = 'approved';
      await teacher.save();
    }
    console.log(`✅ Teacher configured: ${teacher.name} (${teacher.email})`);

    // 4. Get or create a course
    let course = await Course.findOne();
    if (!course) {
      console.log('🔄 No courses found, creating a test course...');
      course = await Course.create({
        title: 'CA Foundation Accounts Masterclass',
        description: 'Complete syllabus coverage of Principles and Practice of Accounting for CA Foundation.',
        category: 'CA Foundation',
        instructor: teacher.name,
        price: 9999,
        duration: '120 hours',
        thumbnail: {
          url: 'https://res.cloudinary.com/demo/image/upload/v1615234914/sample.jpg'
        },
        level: 'Beginner',
        language: 'English',
        isPublished: true
      });
    }
    console.log(`✅ Course configured: ${course.title}`);

    // 5. Ensure student is enrolled in the course
    let enrollment = await Enrollment.findOne({ studentId: student._id, courseId: course._id });
    if (!enrollment) {
      console.log('🔄 Student not enrolled in course, enrolling now...');
      enrollment = await Enrollment.create({
        studentId: student._id,
        courseId: course._id,
        status: 'active',
        progress: 35
      });
    }
    console.log(`✅ Enrollment configured: student enrolled in ${course.title}`);

    // 6. Delete old live classes and create fresh mock classes
    await LiveClass.deleteMany({ courseId: course._id });
    
    const now = new Date();
    const mockClasses = [
      {
        title: 'Introduction to Partnership Accounts',
        description: 'Learn the basic concepts of partnership, profit & loss appropriation account, and partner capital accounts.',
        courseId: course._id,
        teacherId: teacher._id,
        meetingLink: 'https://zoom.us/j/9876543210',
        startTime: new Date(now.getTime() - 10 * 60 * 1000), // Started 10 mins ago
        endTime: new Date(now.getTime() + 50 * 60 * 1000),   // Ends in 50 mins
        status: 'live'
      },
      {
        title: 'Consignment Accounts & Valuation of Stock',
        description: 'Detailed analysis of consignment transactions, normal and abnormal losses, and closing stock valuation.',
        courseId: course._id,
        teacherId: teacher._id,
        meetingLink: 'https://zoom.us/j/9876543211',
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(now.getTime() + 25.5 * 60 * 60 * 1000),
        status: 'scheduled'
      },
      {
        title: 'Bank Reconciliation Statement (BRS) - Part 1',
        description: 'Understanding causes of difference between cash book and pass book balances and preparing BRS.',
        courseId: course._id,
        teacherId: teacher._id,
        meetingLink: 'https://zoom.us/j/9876543212',
        startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        status: 'completed',
        recordingUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
      }
    ];

    await LiveClass.insertMany(mockClasses);
    console.log('✅ Mock live classes seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Parent Portal Credentials:');
    console.log('📧 Email:    parent@shri.com');
    console.log('🔑 Password: Parent@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedParentData();
