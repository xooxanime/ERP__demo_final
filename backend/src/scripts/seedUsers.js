import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Permission from '../models/Permission.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import connectDB from '../config/database.js';

dotenv.config();

const COMMON_PASSWORD = 'Test@123';

const studentsData = [
  { name: 'Aarav Sharma', email: 'student1@shri.com', phone: '9811111111' },
  { name: 'Vihaan Patel', email: 'student2@shri.com', phone: '9811111112' },
  { name: 'Aditya Verma', email: 'student3@shri.com', phone: '9811111113' },
  { name: 'Ananya Gupta', email: 'student4@shri.com', phone: '9811111114' },
  { name: 'Diya Iyer', email: 'student5@shri.com', phone: '9811111115' },
  { name: 'Sai Reddy', email: 'student6@shri.com', phone: '9811111116' },
  { name: 'Kabir Malhotra', email: 'student7@shri.com', phone: '9811111117' },
  { name: 'Ishaan Joshi', email: 'student8@shri.com', phone: '9811111118' },
  { name: 'Myra Nair', email: 'student9@shri.com', phone: '9811111119' },
  { name: 'Riya Sen', email: 'student10@shri.com', phone: '9811111120' }
];

const parentsData = [
  { name: 'Ramesh Sharma', email: 'parent1@shri.com', phone: '9911111111', studentEmail: 'student1@shri.com', relationship: 'father' },
  { name: 'Kirti Patel', email: 'parent2@shri.com', phone: '9911111112', studentEmail: 'student2@shri.com', relationship: 'mother' },
  { name: 'Suresh Verma', email: 'parent3@shri.com', phone: '9911111113', studentEmail: 'student3@shri.com', relationship: 'father' },
  { name: 'Sunita Gupta', email: 'parent4@shri.com', phone: '9911111114', studentEmail: 'student4@shri.com', relationship: 'mother' },
  { name: 'Venkat Iyer', email: 'parent5@shri.com', phone: '9911111115', studentEmail: 'student5@shri.com', relationship: 'father' },
  { name: 'Srinivasa Reddy', email: 'parent6@shri.com', phone: '9911111116', studentEmail: 'student6@shri.com', relationship: 'father' },
  { name: 'Sanjay Malhotra', email: 'parent7@shri.com', phone: '9911111117', studentEmail: 'student7@shri.com', relationship: 'father' },
  { name: 'Rajesh Joshi', email: 'parent8@shri.com', phone: '9911111118', studentEmail: 'student8@shri.com', relationship: 'father' },
  { name: 'Geetha Nair', email: 'parent9@shri.com', phone: '9911111119', studentEmail: 'student9@shri.com', relationship: 'mother' },
  { name: 'Amit Sen', email: 'parent10@shri.com', phone: '9911111120', studentEmail: 'student10@shri.com', relationship: 'father' }
];

const teachersData = [
  {
    name: 'Dr. Amit Patel',
    email: 'teacher1@shri.com',
    phone: '9711111111',
    teacherInfo: {
      qualifications: 'Ph.D. in Computer Science',
      experience: '12 years',
      specialization: 'Web Development & Javascript',
      department: 'Technology'
    }
  },
  {
    name: 'Prof. Priya Rao',
    email: 'teacher2@shri.com',
    phone: '9711111112',
    teacherInfo: {
      qualifications: 'M.Tech in Software Engineering',
      experience: '8 years',
      specialization: 'Python & Machine Learning',
      department: 'Programming'
    }
  },
  {
    name: 'Harish Mehta',
    email: 'teacher3@shri.com',
    phone: '9711111113',
    teacherInfo: {
      qualifications: 'B.Tech in Information Technology',
      experience: '6 years',
      specialization: 'Data Structures & Algorithms',
      department: 'Computer Science'
    }
  }
];

export const seedUsers = async () => {
  console.log('🌱 Starting to seed students, parents, and teachers...');
  try {
    // 1. Resolve Permissions
    const studentPerm = await Permission.findOne({ role: 'student' });
    const parentPerm = await Permission.findOne({ role: 'parent' });
    const teacherPerm = await Permission.findOne({ role: 'teacher' });

    if (!studentPerm || !parentPerm || !teacherPerm) {
      console.log('⚠️ Roles permissions missing. Please seed permissions first.');
      throw new Error('Permissions not seeded');
    }

    const studentPermId = studentPerm._id;
    const parentPermId = parentPerm._id;
    const teacherPermId = teacherPerm._id;

    // 2. Seed Students
    const studentDocs = {};
    for (const student of studentsData) {
      let user = await User.findOne({ email: student.email });
      if (user) {
        user.name = student.name;
        user.phone = student.phone;
        user.role = 'student';
        user.approvalStatus = 'approved';
        user.permissions = studentPermId;
        user.password = COMMON_PASSWORD;
        await user.save();
        console.log(`📝 Updated student: ${student.name} (${student.email})`);
      } else {
        user = await User.create({
          name: student.name,
          email: student.email,
          phone: student.phone,
          password: COMMON_PASSWORD,
          role: 'student',
          approvalStatus: 'approved',
          permissions: studentPermId
        });
        console.log(`🆕 Created student: ${student.name} (${student.email})`);
      }
      studentDocs[student.email] = user;
    }

    // 3. Seed Parents
    for (const parent of parentsData) {
      const studentDoc = studentDocs[parent.studentEmail];
      if (!studentDoc) {
        throw new Error(`Mapping failed: student with email ${parent.studentEmail} not found for parent ${parent.name}`);
      }

      const parentInfo = {
        studentId: studentDoc._id,
        studentName: studentDoc.name,
        relationship: parent.relationship
      };

      let user = await User.findOne({ email: parent.email });
      if (user) {
        user.name = parent.name;
        user.phone = parent.phone;
        user.role = 'parent';
        user.approvalStatus = 'approved';
        user.permissions = parentPermId;
        user.password = COMMON_PASSWORD;
        user.parentInfo = parentInfo;
        await user.save();
        console.log(`📝 Updated parent: ${parent.name} (${parent.email})`);
      } else {
        user = await User.create({
          name: parent.name,
          email: parent.email,
          phone: parent.phone,
          password: COMMON_PASSWORD,
          role: 'parent',
          approvalStatus: 'approved',
          permissions: parentPermId,
          parentInfo: parentInfo
        });
        console.log(`🆕 Created parent: ${parent.name} (${parent.email})`);
      }

      // Upsert approval request for parent
      let approvalReq = await ApprovalRequest.findOne({ email: parent.email });
      if (approvalReq) {
        approvalReq.userId = user._id;
        approvalReq.name = parent.name;
        approvalReq.phone = parent.phone;
        approvalReq.requestedRole = 'parent';
        approvalReq.status = 'approved';
        approvalReq.parentInfo = {
          studentName: studentDoc.name,
          studentEmail: studentDoc.email,
          relationship: parent.relationship,
          studentId: studentDoc._id
        };
        approvalReq.approvedAt = Date.now();
        await approvalReq.save();
      } else {
        approvalReq = await ApprovalRequest.create({
          userId: user._id,
          email: parent.email,
          name: parent.name,
          phone: parent.phone,
          requestedRole: 'parent',
          status: 'approved',
          parentInfo: {
            studentName: studentDoc.name,
            studentEmail: studentDoc.email,
            relationship: parent.relationship,
            studentId: studentDoc._id
          },
          approvedAt: Date.now()
        });
      }

      user.approvalRequest = approvalReq._id;
      await user.save();
    }

    // 4. Seed Teachers
    for (const teacher of teachersData) {
      let user = await User.findOne({ email: teacher.email });
      if (user) {
        user.name = teacher.name;
        user.phone = teacher.phone;
        user.role = 'teacher';
        user.approvalStatus = 'approved';
        user.permissions = teacherPermId;
        user.password = COMMON_PASSWORD;
        user.teacherInfo = teacher.teacherInfo;
        await user.save();
        console.log(`📝 Updated teacher: ${teacher.name} (${teacher.email})`);
      } else {
        user = await User.create({
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          password: COMMON_PASSWORD,
          role: 'teacher',
          approvalStatus: 'approved',
          permissions: teacherPermId,
          teacherInfo: teacher.teacherInfo
        });
        console.log(`🆕 Created teacher: ${teacher.name} (${teacher.email})`);
      }

      // Upsert approval request for teacher
      let approvalReq = await ApprovalRequest.findOne({ email: teacher.email });
      if (approvalReq) {
        approvalReq.userId = user._id;
        approvalReq.name = teacher.name;
        approvalReq.phone = teacher.phone;
        approvalReq.requestedRole = 'teacher';
        approvalReq.status = 'approved';
        approvalReq.teacherInfo = teacher.teacherInfo;
        approvalReq.approvedAt = Date.now();
        await approvalReq.save();
      } else {
        approvalReq = await ApprovalRequest.create({
          userId: user._id,
          email: teacher.email,
          name: teacher.name,
          phone: teacher.phone,
          requestedRole: 'teacher',
          status: 'approved',
          teacherInfo: teacher.teacherInfo,
          approvedAt: Date.now()
        });
      }

      user.approvalRequest = approvalReq._id;
      await user.save();
    }

    console.log('✨ Users seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during users seeding:', error);
    throw error;
  }
};

if (process.argv[1] && process.argv[1].endsWith('seedUsers.js')) {
  (async () => {
    await connectDB();
    await seedUsers();
    process.exit(0);
  })();
}
