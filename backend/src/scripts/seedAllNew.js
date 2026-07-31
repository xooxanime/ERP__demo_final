import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from '../config/database.js';
import User from '../models/User.js';
import Permission from '../models/Permission.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';

import { seedCourses } from './seedCourses.js';
import { seedUsers } from './seedUsers.js';
import { seedEnrollments } from './seedEnrollments.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal valid PDF Content
const MINIMAL_PDF = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 50 >>
stream
BT
/F1 12 Tf
72 712 Td
(ERP Testing Resources Placeholder PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000223 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
320
%%EOF`;

const seedPermissions = async () => {
  console.log('🌱 Seeding permissions...');
  const permissionsList = [
    {
      role: 'student',
      permissions: {
        dashboard: { view: true, edit: false },
        courses: { view: true, create: false, edit: false, delete: false, enroll: true },
        students: { view: false, create: false, edit: false, delete: false, viewProgress: false },
        payments: { view: true, process: true, edit: false },
        studyMaterials: { view: true, upload: false, edit: false, delete: false },
        approvals: { viewRequests: false, approveReject: false },
        faculty: { view: false, create: false, edit: false, delete: false },
        analytics: { view: false },
        userManagement: { view: false, create: false, edit: false, delete: false }
      },
      description: 'Student access permissions'
    },
    {
      role: 'teacher',
      permissions: {
        dashboard: { view: true, edit: false },
        courses: { view: true, create: false, edit: true, delete: false, enroll: false },
        students: { view: true, create: false, edit: false, delete: false, viewProgress: true },
        payments: { view: true, process: false, edit: false },
        studyMaterials: { view: true, upload: true, edit: true, delete: true },
        approvals: { viewRequests: false, approveReject: false },
        faculty: { view: false, create: false, edit: false, delete: false },
        analytics: { view: true },
        userManagement: { view: false, create: false, edit: false, delete: false }
      },
      description: 'Teacher access permissions'
    },
    {
      role: 'parent',
      permissions: {
        dashboard: { view: true, edit: false },
        courses: { view: true, create: false, edit: false, delete: false, enroll: false },
        students: { view: true, create: false, edit: false, delete: false, viewProgress: true },
        payments: { view: true, process: true, edit: false },
        studyMaterials: { view: true, upload: false, edit: false, delete: false },
        approvals: { viewRequests: false, approveReject: false },
        faculty: { view: false, create: false, edit: false, delete: false },
        analytics: { view: false },
        userManagement: { view: false, create: false, edit: false, delete: false }
      },
      description: 'Parent access permissions'
    },
    {
      role: 'admin',
      permissions: {
        dashboard: { view: true, edit: true },
        courses: { view: true, create: true, edit: true, delete: true, enroll: false },
        students: { view: true, create: true, edit: true, delete: true, viewProgress: true },
        payments: { view: true, process: true, edit: true },
        studyMaterials: { view: true, upload: true, edit: true, delete: true },
        approvals: { viewRequests: true, approveReject: true },
        faculty: { view: true, create: true, edit: true, delete: true },
        analytics: { view: true },
        userManagement: { view: true, create: true, edit: true, delete: true }
      },
      description: 'Admin full access permissions'
    }
  ];

  for (const perm of permissionsList) {
    await Permission.findOneAndUpdate(
      { role: perm.role },
      perm,
      { upsert: true, new: true }
    );
  }
  console.log('✅ Permissions upserted successfully!');
};

const seedAdmins = async () => {
  console.log('🌱 Seeding administrators...');
  const adminPerm = await Permission.findOne({ role: 'admin' });
  const adminPermId = adminPerm ? adminPerm._id : null;

  const admins = [
    { name: 'Admin User', email: 'admin@shri.com', phone: '9999999999', password: 'Admin@123', role: 'admin', approvalStatus: 'approved' },
    { name: 'Admin User', email: 'abhaypratapmishra5678@gmail.com', phone: '9999999999', password: 'Abhay1230!@', role: 'admin', approvalStatus: 'approved' }
  ];

  for (const adminData of admins) {
    let user = await User.findOne({ email: adminData.email });
    if (user) {
      user.name = adminData.name;
      user.phone = adminData.phone;
      user.role = 'admin';
      user.approvalStatus = 'approved';
      user.password = adminData.password;
      if (adminPermId) user.permissions = adminPermId;
      await user.save();
      console.log(`📝 Updated admin account: ${adminData.email}`);
    } else {
      await User.create({
        ...adminData,
        permissions: adminPermId
      });
      console.log(`🆕 Created admin account: ${adminData.email}`);
    }
  }
};

const createGoogleDrivePlaceholders = () => {
  console.log('📂 Creating Google Drive folders structure and placeholders...');
  const baseDir = path.join(__dirname, '../../../testing-data/ERP Testing Resources');

  const structure = {
    'Web Development': {
      modules: `# Web Development Syllabus Modules
- Module 1: Introduction to HTML5 & CSS3
- Module 2: JavaScript Deep Dive
- Module 3: React Framework Fundamentals`,
      links: `# Web Development Recommended YouTube Videos
- Web Development Roadmap: https://www.youtube.com/watch?v=z0n1_D110Q8
- HTML5 Semantic Structure: https://www.youtube.com/watch?v=kUMe1FH4WHY
- JavaScript for Beginners: https://www.youtube.com/watch?v=W6NZfCO5SIk
- React JS course: https://www.youtube.com/watch?v=bMknfKXIFA8`
    },
    'Python Programming': {
      modules: `# Python Programming Syllabus Modules
- Module 1: Python Basics & Local Environment Setup
- Module 2: Control Flow & Custom Functions
- Module 3: Object-Oriented Programming (OOP) in Python`,
      links: `# Python Programming Recommended YouTube Videos
- Python for Beginners Tutorial: https://www.youtube.com/watch?v=_uQrJ0TkZlc
- Conditionals and Loops: https://www.youtube.com/watch?v=6iF8Xb7Z3kQ
- Custom Functions: https://www.youtube.com/watch?v=9Os0o3wzS_I
- Object Oriented Python: https://www.youtube.com/watch?v=JeznW_7DlB0`
    },
    'Data Structures & Algorithms': {
      modules: `# Data Structures & Algorithms Syllabus Modules
- Module 1: Complexity Analysis & Array Structures
- Module 2: Linked Lists, Stacks & Queues
- Module 3: Trees and Graph Traversal Algorithms`,
      links: `# DSA Recommended YouTube Videos
- Big O Notation: https://www.youtube.com/watch?v=V6mKVRU1evU
- Linked List Implementations: https://www.youtube.com/watch?v=WwfhLC16bis
- Stack & Queue Data Structures: https://www.youtube.com/watch?v=wjI1WNcIntg
- Tree Traversals BFS & DFS: https://www.youtube.com/watch?v=pcKY4hjDrxk`
    }
  };

  for (const [courseName, contents] of Object.entries(structure)) {
    const coursePath = path.join(baseDir, courseName);
    fs.mkdirSync(coursePath, { recursive: true });

    // Write syllabus.pdf and notes.pdf
    fs.writeFileSync(path.join(coursePath, 'syllabus.pdf'), MINIMAL_PDF);
    fs.writeFileSync(path.join(coursePath, 'notes.pdf'), MINIMAL_PDF);

    // Write markdown helper lists
    fs.writeFileSync(path.join(coursePath, 'module_list.md'), contents.modules);
    fs.writeFileSync(path.join(coursePath, 'recommended_youtube_links.md'), contents.links);

    console.log(`📁 Folders and files created for "${courseName}"`);
  }
};

const generateCredentialsFiles = async () => {
  console.log('📊 Generating credentials spreadsheet files (CSV & XLS)...');
  const testingDataDir = path.join(__dirname, '../../../testing-data');
  fs.mkdirSync(testingDataDir, { recursive: true });

  const seededUsers = await User.find().populate('enrolledCourses');

  const rows = [];

  for (const user of seededUsers) {
    if (!['student', 'parent', 'teacher', 'admin'].includes(user.role)) continue;

    let assignedCoursesStr = 'N/A';
    let mappingStr = 'N/A';
    const plainTextPassword = user.role === 'admin' 
      ? (user.email === 'admin@shri.com' ? 'Admin@123' : 'Abhay1230!@')
      : 'Test@123';

    if (user.role === 'student') {
      if (user.enrolledCourses && user.enrolledCourses.length > 0) {
        assignedCoursesStr = user.enrolledCourses.map(c => c.title).join(' | ');
      }
      const parent = await User.findOne({ role: 'parent', 'parentInfo.studentId': user._id });
      if (parent) {
        mappingStr = `Parent: ${parent.name} (${parent.email})`;
      }
    } else if (user.role === 'parent') {
      if (user.parentInfo && user.parentInfo.studentId) {
        const student = await User.findById(user.parentInfo.studentId).populate('enrolledCourses');
        if (student) {
          mappingStr = `Student: ${student.name} (${student.email})`;
          if (student.enrolledCourses && student.enrolledCourses.length > 0) {
            assignedCoursesStr = student.enrolledCourses.map(c => c.title).join(' | ');
          }
        }
      }
    } else if (user.role === 'teacher') {
      if (user.teacherInfo && user.teacherInfo.assignedCourses && user.teacherInfo.assignedCourses.length > 0) {
        const courses = await Course.find({ _id: { $in: user.teacherInfo.assignedCourses } });
        assignedCoursesStr = courses.map(c => c.title).join(' | ');
      }
    }

    rows.push({
      name: user.name,
      role: user.role.toUpperCase(),
      email: user.email,
      password: plainTextPassword,
      courses: assignedCoursesStr,
      mapping: mappingStr
    });
  }

  // Write CSV
  let csvContent = 'Name,Role,Email,Password,Assigned Course(s),Relative Mapping\n';
  for (const row of rows) {
    const escapedName = `"${row.name.replace(/"/g, '""')}"`;
    const escapedRole = `"${row.role}"`;
    const escapedEmail = `"${row.email}"`;
    const escapedPassword = `"${row.password}"`;
    const escapedCourses = `"${row.courses.replace(/"/g, '""')}"`;
    const escapedMapping = `"${row.mapping.replace(/"/g, '""')}"`;
    csvContent += `${escapedName},${escapedRole},${escapedEmail},${escapedPassword},${escapedCourses},${escapedMapping}\n`;
  }
  fs.writeFileSync(path.join(testingDataDir, 'credentials.csv'), csvContent, 'utf-8');
  console.log('✅ credentials.csv generated!');

  // Write Excel-compatible XLS (HTML Table wrapper)
  let xlsContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th { background-color: #4CAF50; color: white; padding: 8px; text-align: left; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h2>ERP Seeding Environment Credentials</h2>
  <table>
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Email</th>
      <th>Password</th>
      <th>Assigned Course(s)</th>
      <th>Parent-Student Mapping</th>
    </tr>`;

  for (const row of rows) {
    xlsContent += `
    <tr>
      <td>${row.name}</td>
      <td>${row.role}</td>
      <td>${row.email}</td>
      <td>${row.password}</td>
      <td>${row.courses}</td>
      <td>${row.mapping}</td>
    </tr>`;
  }

  xlsContent += `
  </table>
</body>
</html>`;
  fs.writeFileSync(path.join(testingDataDir, 'credentials.xls'), xlsContent, 'utf-8');
  console.log('✅ credentials.xls generated!');
};

const runAll = async () => {
  try {
    await connectDB();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 STARTING ERP MASTER SEEDING PROCESS...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Seed permissions
    await seedPermissions();
    console.log('');

    // 2. Seed admins
    await seedAdmins();
    console.log('');

    // 3. Seed Courses
    await seedCourses();

    // 4. Seed Users
    await seedUsers();

    // 5. Seed Enrollments
    await seedEnrollments();

    // 6. Create Google Drive Placeholders
    createGoogleDrivePlaceholders();
    console.log('');

    // 7. Generate Excel/CSV Files
    await generateCredentialsFiles();
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ ALL ERP SEED DATA SEEDED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  }
};

runAll();
