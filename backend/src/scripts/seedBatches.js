import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Batch from '../models/Batch.js';
import Assignment from '../models/Assignment.js';
import Quiz from '../models/Quiz.js';
import Enrollment from '../models/Enrollment.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const seedBatches = async () => {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // 1. Clear existing batches, assignments, quizzes, and their submissions/attempts
    console.log('🧹 Cleaning old batch data...');
    await Batch.deleteMany({});
    await Assignment.deleteMany({});
    await Quiz.deleteMany({});
    
    // 2. Fetch seeded users & courses
    console.log('👥 Fetching users & courses...');
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      throw new Error('No admin user found. Please run seedAdmin first.');
    }

    const teacher1 = await User.findOne({ email: 'teacher@shri.com' });
    const teacher2 = await User.findOne({ email: 'teacher1@shri.com' }); // Dr. Amit Patel
    const teachers = [teacher1, teacher2].filter(Boolean);

    const student1 = await User.findOne({ email: 'thekrishnam13@gmail.com' });
    const student2 = await User.findOne({ email: 'student@shri.com' });
    const student3 = await User.findOne({ email: 'student1@shri.com' });
    const student4 = await User.findOne({ email: 'student2@shri.com' });
    const students = [student1, student2, student3, student4].filter(Boolean);

    const course1 = await Course.findOne({ title: /accounts/i });
    const course2 = await Course.findOne({ title: /web/i });
    const courses = [course1, course2].filter(Boolean);

    if (teachers.length === 0 || students.length === 0 || courses.length === 0) {
      console.log('⚠️ Could not find seeded teachers, students, or courses. Creating mock entries if needed.');
    }

    // 3. Create Batch A
    console.log('📦 Creating Batch A...');
    const batchA = await Batch.create({
      name: 'CA Foundation Masterclass Batch A',
      description: 'Main study group for CA Foundation Masterclass course preparation. Features assignments and practice quizzes.',
      teachers: teachers.map(t => t._id),
      students: students.map(s => s._id),
      courses: courses.map(c => c._id),
      createdBy: admin._id
    });
    console.log(`✅ Created Batch: ${batchA.name}`);

    // Sync student enrollments for courses in this batch
    console.log('🔄 Syncing enrollments for Batch A students...');
    for (const student of students) {
      for (const course of courses) {
        await Enrollment.findOneAndUpdate(
          { studentId: student._id, courseId: course._id },
          { 
            $setOnInsert: { 
              studentId: student._id, 
              courseId: course._id,
              status: 'active',
              progress: 0,
              completedVideos: [],
              enrollmentDate: new Date()
            } 
          },
          { upsert: true }
        );
      }
    }

    // 4. Create an assignment
    if (course1) {
      console.log('📝 Creating Assignment...');
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5); // due in 5 days
      
      const assignment = await Assignment.create({
        title: 'Accounting Standards Homework 1',
        description: 'Complete all exercise questions from Chapter 2: General Accounting Principles and upload your answers in a PDF link.',
        dueDate,
        courseId: course1._id,
        batchId: batchA._id,
        attachments: [{ title: 'Homework Guide', url: 'https://example.com/homework-guide.pdf' }],
        createdBy: teachers[0]?._id || admin._id
      });
      console.log(`✅ Created Assignment: ${assignment.title}`);
    }

    // 5. Create a Quiz
    if (course1) {
      console.log('🏆 Creating Quiz...');
      const quizDueDate = new Date();
      quizDueDate.setDate(quizDueDate.getDate() + 3); // due in 3 days

      const quiz = await Quiz.create({
        title: 'Financial Statements Basics Quiz',
        description: 'A quick quiz containing fundamental questions on Balance Sheets and Profit & Loss Accounts.',
        courseId: course1._id,
        batchId: batchA._id,
        dueDate: quizDueDate,
        duration: 15,
        questions: [
          {
            questionText: 'Which of the following is a liability?',
            options: ['Cash in Hand', 'Accounts Receivable', 'Creditors', 'Machinery'],
            correctOptionIndex: 2,
            points: 2
          },
          {
            questionText: 'Debit the receiver, credit the ______?',
            options: ['Giver', 'Owner', 'Buyer', 'Seller'],
            correctOptionIndex: 0,
            points: 2
          },
          {
            questionText: 'A balance sheet represents the financial status of a company for a single day.',
            options: ['True', 'False', 'Depends on company type', 'None of the above'],
            correctOptionIndex: 0,
            points: 2
          }
        ],
        createdBy: teachers[0]?._id || admin._id,
        isPublished: true
      });
      console.log(`✅ Created Quiz: ${quiz.title}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Batch seeder complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding batches:', error.message);
    process.exit(1);
  }
};

seedBatches();
