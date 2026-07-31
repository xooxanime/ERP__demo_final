import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'admin'],
    required: true,
    unique: true
  },
  permissions: {
    dashboard: {
      view: { type: Boolean, default: true },
      edit: { type: Boolean, default: false }
    },
    courses: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      enroll: { type: Boolean, default: false }
    },
    students: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      viewProgress: { type: Boolean, default: false }
    },
    payments: {
      view: { type: Boolean, default: false },
      process: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    studyMaterials: {
      view: { type: Boolean, default: true },
      upload: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    approvals: {
      viewRequests: { type: Boolean, default: false },
      approveReject: { type: Boolean, default: false }
    },
    faculty: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    analytics: {
      view: { type: Boolean, default: false }
    },
    userManagement: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
