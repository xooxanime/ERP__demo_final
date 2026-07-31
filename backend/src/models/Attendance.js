import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  liveClassId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveClass',
    required: false
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    index: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false,
    index: true
  },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    index: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: Date,
  durationMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave'],
    default: 'present'
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Helper to drop legacy index if it exists in MongoDB to prevent unique constraint failures on null values
const dropLegacyIndex = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections({ name: 'attendances' }).toArray();
    if (collections.length > 0) {
      await mongoose.connection.db.collection('attendances').dropIndex('liveClassId_1_studentId_1').catch(() => {});
    }
  } catch (err) {
    console.warn('Could not drop legacy attendance index:', err.message);
  }
};

if (mongoose.connection.readyState === 1) {
  dropLegacyIndex();
} else {
  mongoose.connection.once('open', dropLegacyIndex);
}

// Avoid duplicate attendance for same live class by student (only when liveClassId is provided)
attendanceSchema.index(
  { liveClassId: 1, studentId: 1 }, 
  { unique: true, partialFilterExpression: { liveClassId: { $exists: true } } }
);

// Avoid duplicate attendance for same student, batch, course, and date
attendanceSchema.index(
  { batchId: 1, date: 1, studentId: 1, courseId: 1 },
  { unique: true, partialFilterExpression: { batchId: { $exists: true }, date: { $exists: true } } }
);

// Compound index for quick attendance monitoring per student per year
attendanceSchema.index({ studentId: 1, academicSessionId: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;