import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import connectDB from '../config/database.js';

dotenv.config();

// Course mappings for students (1-based index)
const enrollmentMapping = [
  { studentEmail: 'student1@shri.com', courseTitle: 'Web Development Masterclass' },
  { studentEmail: 'student2@shri.com', courseTitle: 'Web Development Masterclass' },
  { studentEmail: 'student3@shri.com', courseTitle: 'Web Development Masterclass' },
  { studentEmail: 'student4@shri.com', courseTitle: 'Web Development Masterclass' },
  { studentEmail: 'student4@shri.com', courseTitle: 'Python Programming Bootcamp' }, // Student 4 enrolled in two
  { studentEmail: 'student5@shri.com', courseTitle: 'Python Programming Bootcamp' },
  { studentEmail: 'student6@shri.com', courseTitle: 'Python Programming Bootcamp' },
  { studentEmail: 'student7@shri.com', courseTitle: 'Python Programming Bootcamp' },
  { studentEmail: 'student7@shri.com', courseTitle: 'Data Structures & Algorithms Deep Dive' }, // Student 7 enrolled in two
  { studentEmail: 'student8@shri.com', courseTitle: 'Data Structures & Algorithms Deep Dive' },
  { studentEmail: 'student9@shri.com', courseTitle: 'Data Structures & Algorithms Deep Dive' },
  { studentEmail: 'student10@shri.com', courseTitle: 'Data Structures & Algorithms Deep Dive' }
];

// Course mappings for teachers
const teacherMapping = [
  { email: 'teacher1@shri.com', courseTitle: 'Web Development Masterclass' },
  { email: 'teacher2@shri.com', courseTitle: 'Python Programming Bootcamp' },
  { email: 'teacher3@shri.com', courseTitle: 'Data Structures & Algorithms Deep Dive' }
];

export const seedEnrollments = async () => {
  console.log('🌱 Starting to seed enrollments and student progress...');
  try {
    // 1. Map teachers to courses
    for (const mapping of teacherMapping) {
      const teacher = await User.findOne({ email: mapping.email, role: 'teacher' });
      const course = await Course.findOne({ title: mapping.courseTitle });

      if (!teacher || !course) {
        console.log(`⚠️ Mapping failed for teacher: ${mapping.email} or course: ${mapping.courseTitle}`);
        continue;
      }

      // Initialize assignedCourses if empty
      if (!teacher.teacherInfo) {
        teacher.teacherInfo = {};
      }
      if (!teacher.teacherInfo.assignedCourses) {
        teacher.teacherInfo.assignedCourses = [];
      }

      // Add course to teacher's assignments (idempotent check)
      if (!teacher.teacherInfo.assignedCourses.includes(course._id)) {
        teacher.teacherInfo.assignedCourses.push(course._id);
        await teacher.save();
        console.log(`👩‍🏫 Assigned Course "${course.title}" to teacher: ${teacher.name}`);
      } else {
        console.log(`👩‍🏫 Course "${course.title}" already assigned to teacher: ${teacher.name}`);
      }
    }

    // 2. Enroll students and create progress
    for (const mapping of enrollmentMapping) {
      const student = await User.findOne({ email: mapping.studentEmail, role: 'student' });
      const course = await Course.findOne({ title: mapping.courseTitle });

      if (!student || !course) {
        console.log(`⚠️ Mapping failed for student: ${mapping.studentEmail} or course: ${mapping.courseTitle}`);
        continue;
      }

      // Link course inside student's enrolledCourses list
      if (!student.enrolledCourses) {
        student.enrolledCourses = [];
      }
      if (!student.enrolledCourses.includes(course._id)) {
        student.enrolledCourses.push(course._id);
        await student.save();
      }

      // Find or create enrollment (idempotent)
      let enrollment = await Enrollment.findOne({ studentId: student._id, courseId: course._id });
      if (!enrollment) {
        enrollment = await Enrollment.create({
          studentId: student._id,
          courseId: course._id,
          enrollmentDate: Date.now(),
          status: 'active',
          progress: 0
        });
        console.log(`📝 Created enrollment for Student "${student.name}" -> Course "${course.title}"`);
      } else {
        console.log(`📝 Enrollment already exists for Student "${student.name}" -> Course "${course.title}"`);
      }

      // Find course modules to populate progress completed videos
      const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
      const allVideos = [];
      modules.forEach(mod => {
        if (mod.videos && mod.videos.length > 0) {
          mod.videos.forEach(vid => {
            allVideos.push(vid);
          });
        }
      });

      const totalVideos = allVideos.length;
      // Complete first video if available
      const completedVideos = [];
      if (totalVideos > 0 && allVideos[0]._id) {
        completedVideos.push(allVideos[0]._id);
      }

      const completionPercentage = totalVideos > 0 ? Math.round((completedVideos.length / totalVideos) * 100) : 0;

      // Update enrollment progress percentage
      enrollment.progress = completionPercentage;
      await enrollment.save();

      // Create Progress record
      let progress = await Progress.findOne({ student: student._id, course: course._id });
      
      const quizScores = [
        {
          quiz: `Module 1: Quiz on ${course.title.split(' ')[0]} Basics`,
          score: 8,
          totalQuestions: 10,
          date: new Date(Date.now() - 86400000 * 3)
        }
      ];

      const assignments = [
        {
          title: `Assignment 1: ${course.title.split(' ')[0]} Foundations`,
          submitted: true,
          score: 9,
          submittedDate: new Date(Date.now() - 86400000 * 2),
          dueDate: new Date(Date.now() - 86400000 * 1)
        },
        {
          title: `Assignment 2: Intermediate ${course.title.split(' ')[0]} Practice`,
          submitted: false,
          dueDate: new Date(Date.now() + 86400000 * 5)
        }
      ];

      if (progress) {
        progress.completedVideos = completedVideos;
        progress.totalVideos = totalVideos;
        progress.completionPercentage = completionPercentage;
        progress.quizScores = quizScores;
        progress.assignments = assignments;
        progress.timeSpent = 45; // 45 minutes spent
        progress.lastAccessed = Date.now();
        await progress.save();
        console.log(`📈 Updated progress details for Student "${student.name}" in Course "${course.title}" (${completionPercentage}%)`);
      } else {
        progress = await Progress.create({
          student: student._id,
          course: course._id,
          completedVideos,
          totalVideos,
          completionPercentage,
          timeSpent: 45,
          lastAccessed: Date.now(),
          quizScores,
          assignments
        });
        console.log(`📈 Created progress details for Student "${student.name}" in Course "${course.title}" (${completionPercentage}%)`);
      }
    }

    console.log('✨ Enrollments and student progress seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during enrollment seeding:', error);
    throw error;
  }
};

if (process.argv[1] && process.argv[1].endsWith('seedEnrollments.js')) {
  (async () => {
    await connectDB();
    await seedEnrollments();
    process.exit(0);
  })();
}
