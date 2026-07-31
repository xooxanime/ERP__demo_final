import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Permission from '../models/Permission.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedPermissions = async () => {
  try {
    await connectDB();

    // Delete existing permissions
    await Permission.deleteMany({});

    console.log('🗑️  Deleted old permissions');

    // Define permissions for each role
    const permissions = [
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

    // Create permissions
    await Permission.insertMany(permissions);

    console.log('✅ Permissions seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Permissions created for:');
    permissions.forEach(p => {
      console.log(`  • ${p.role.toUpperCase()}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  }
};

seedPermissions();
