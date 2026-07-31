import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from '../config/database.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import Module from '../models/Module.js';
import StudyMaterial from '../models/StudyMaterial.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const studentEmails = Array.from({ length: 10 }, (_, i) => `student${i + 1}@shri.com`);
const parentEmails = Array.from({ length: 10 }, (_, i) => `parent${i + 1}@shri.com`);
const teacherEmails = Array.from({ length: 3 }, (_, i) => `teacher${i + 1}@shri.com`);

const verifyDatabase = async () => {
  try {
    await connectDB();

    console.log('\n🔍 RUNNING ERP SEED VERIFICATION INTEGRITY CHECKS FOR SEEDED DATA...\n');
    let passed = true;

    // 1. Verify User Counts
    const studentCount = await User.countDocuments({ email: { $in: studentEmails }, role: 'student' });
    const parentCount = await User.countDocuments({ email: { $in: parentEmails }, role: 'parent' });
    const teacherCount = await User.countDocuments({ email: { $in: teacherEmails }, role: 'teacher' });

    console.log('👥 1. USER COUNTS CHECK:');
    if (studentCount === 10) {
      console.log(`   ✅ Students: ${studentCount}/10 found.`);
    } else {
      console.log(`   ❌ Students: ${studentCount}/10 found.`);
      passed = false;
    }

    if (parentCount === 10) {
      console.log(`   ✅ Parents: ${parentCount}/10 found.`);
    } else {
      console.log(`   ❌ Parents: ${parentCount}/10 found.`);
      passed = false;
    }

    if (teacherCount === 3) {
      console.log(`   ✅ Teachers: ${teacherCount}/3 found.`);
    } else {
      console.log(`   ❌ Teachers: ${teacherCount}/3 found.`);
      passed = false;
    }
    console.log('');

    // 2. Verify Parent Student Mapping
    console.log('🔗 2. PARENT ↔ STUDENT LINKAGE CHECK:');
    const parents = await User.find({ email: { $in: parentEmails }, role: 'parent' });
    let mappingPassed = true;
    let mappedCount = 0;

    for (const p of parents) {
      if (!p.parentInfo || !p.parentInfo.studentId) {
        console.log(`   ❌ Parent "${p.name}" (${p.email}) has no linked student info.`);
        mappingPassed = false;
        continue;
      }
      const student = await User.findById(p.parentInfo.studentId);
      if (!student) {
        console.log(`   ❌ Parent "${p.name}" points to non-existent student ID: ${p.parentInfo.studentId}`);
        mappingPassed = false;
      } else if (student.role !== 'student') {
        console.log(`   ❌ Parent "${p.name}" points to a user that is not a student (Role: ${student.role})`);
        mappingPassed = false;
      } else {
        mappedCount++;
      }
    }

    if (mappingPassed && mappedCount === 10) {
      console.log(`   ✅ Linkage: All 10 parent-student mappings validated successfully.`);
    } else {
      console.log(`   ❌ Linkage: Mappings validation failed (Successful count: ${mappedCount}/10).`);
      passed = false;
    }
    console.log('');

    // 3. Verify Course Seeding
    console.log('📚 3. COURSES CHECK:');
    const expectedCourses = [
      'Web Development Masterclass',
      'Python Programming Bootcamp',
      'Data Structures & Algorithms Deep Dive'
    ];

    let coursesPassed = true;
    for (const title of expectedCourses) {
      const course = await Course.findOne({ title });
      if (!course) {
        console.log(`   ❌ Course "${title}" not found in database.`);
        coursesPassed = false;
        continue;
      }

      // Check modules count
      const moduleCount = await Module.countDocuments({ courseId: course._id });
      // Check study materials
      const smCount = await StudyMaterial.countDocuments({ course: course._id });

      if (moduleCount > 0 && smCount > 0) {
        console.log(`   ✅ Course "${title}": Found ${moduleCount} modules, ${smCount} study materials.`);
      } else {
        console.log(`   ❌ Course "${title}": Missing modules (${moduleCount}) or study materials (${smCount}).`);
        coursesPassed = false;
      }
    }

    if (!coursesPassed) {
      passed = false;
    }
    console.log('');

    // 4. Enrollments & Progress Check
    console.log('📝 4. ENROLLMENTS & PROGRESS CHECKS:');
    const students = await User.find({ email: { $in: studentEmails }, role: 'student' });
    let enrollmentsPassed = true;
    let progressPassed = true;

    for (const s of students) {
      const enrolls = await Enrollment.find({ studentId: s._id });
      const prog = await Progress.find({ student: s._id });

      if (enrolls.length > 0) {
        // Success
      } else {
        console.log(`   ❌ Student "${s.name}" (${s.email}) has no enrollment records.`);
        enrollmentsPassed = false;
      }

      if (prog.length > 0) {
        for (const p of prog) {
          if (p.assignments.length === 0 || p.quizScores.length === 0) {
            console.log(`   ❌ Progress for "${s.name}" in course ID "${p.course}" is missing assignments/quizzes.`);
            progressPassed = false;
          }
        }
      } else {
        console.log(`   ❌ Student "${s.name}" (${s.email}) has no progress records.`);
        progressPassed = false;
      }
    }

    if (enrollmentsPassed) {
      console.log('   ✅ Enrollments: All seeded students have active course enrollments.');
    } else {
      passed = false;
    }

    if (progressPassed) {
      console.log('   ✅ Progress Logs: All progress records are initialized with assignments & quiz scores.');
    } else {
      passed = false;
    }
    console.log('');

    // 5. Teacher Assignment Check
    console.log('👩‍🏫 5. TEACHER ASSIGNED COURSES CHECK:');
    const teachers = await User.find({ email: { $in: teacherEmails }, role: 'teacher' });
    let teacherCheckPassed = true;
    for (const t of teachers) {
      if (!t.teacherInfo || !t.teacherInfo.assignedCourses || t.teacherInfo.assignedCourses.length === 0) {
        console.log(`   ❌ Teacher "${t.name}" has no assigned courses.`);
        teacherCheckPassed = false;
      } else {
        const courses = await Course.find({ _id: { $in: t.teacherInfo.assignedCourses } });
        console.log(`   ✅ Teacher "${t.name}": Assigned to "${courses.map(c => c.title).join(', ')}"`);
      }
    }
    if (!teacherCheckPassed) passed = false;
    console.log('');

    // 6. Verify Files and Folder Structure
    console.log('📂 6. TESTING DATA & GOOGLE DRIVE PLACEHOLDERS CHECK:');
    const testingDataPath = path.join(__dirname, '../../../testing-data');
    const csvFile = path.join(testingDataPath, 'credentials.csv');
    const xlsFile = path.join(testingDataPath, 'credentials.xls');
    const driveResourcesPath = path.join(testingDataPath, 'ERP Testing Resources');

    if (fs.existsSync(csvFile) && fs.existsSync(xlsFile)) {
      console.log('   ✅ Spreadsheet files: credentials.csv and credentials.xls exist.');
    } else {
      console.log('   ❌ Spreadsheet files: Missing credentials sheets.');
      passed = false;
    }

    const driveCourses = ['Web Development', 'Python Programming', 'Data Structures & Algorithms'];
    let foldersPassed = true;
    for (const dc of driveCourses) {
      const courseFolder = path.join(driveResourcesPath, dc);
      if (!fs.existsSync(courseFolder)) {
        console.log(`   ❌ Folder missing: ${courseFolder}`);
        foldersPassed = false;
        continue;
      }

      const hasSyllabus = fs.existsSync(path.join(courseFolder, 'syllabus.pdf'));
      const hasNotes = fs.existsSync(path.join(courseFolder, 'notes.pdf'));
      const hasModules = fs.existsSync(path.join(courseFolder, 'module_list.md'));
      const hasLinks = fs.existsSync(path.join(courseFolder, 'recommended_youtube_links.md'));

      if (hasSyllabus && hasNotes && hasModules && hasLinks) {
        console.log(`   ✅ Course Folder "${dc}": Contains syllabus, notes, module list, and recommended video links.`);
      } else {
        console.log(`   ❌ Course Folder "${dc}": Missing placeholder resources.`);
        foldersPassed = false;
      }
    }
    if (!foldersPassed) passed = false;
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (passed) {
      console.log('🌟 VERIFICATION PASSED: Seeding environment is 100% healthy!');
    } else {
      console.log('❌ VERIFICATION FAILED: Please check errors above.');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
};

verifyDatabase();
