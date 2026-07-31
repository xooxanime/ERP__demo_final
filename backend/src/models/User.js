import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin', 'parent'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/avatar-placeholder.png'
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto-approved'],
    default: 'auto-approved'
  },
  approvalRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalRequest'
  },
  parentInfo: {
    studentId: mongoose.Schema.Types.ObjectId,
    studentName: String,
    relationship: {
      type: String,
      enum: ['mother', 'father', 'guardian', 'other'],
      default: 'guardian'
    }
  },
  teacherInfo: {
    qualifications: String,
    experience: String,
    specialization: String,
    department: String,
    assignedCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }]
  },
  permissions: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  },
  notificationPreferences: {
    inApp: {
      type: Boolean,
      default: true
    },
    whatsapp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
