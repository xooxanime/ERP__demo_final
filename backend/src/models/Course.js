import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description']
  },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    index: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['CA Foundation', 'CA Intermediate', 'CA Final', 'Programming', 'Data Science', 'Artificial Intelligence', 'Web Development', 'Cloud Computing', 'Technology']
  },
  instructor: {
    type: String,
    required: [true, 'Please provide instructor name']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  thumbnail: {
    url: {
      type: String,
      required: true
    },
    publicId: String
  },
  paymentQrImage: {
    url: String,
    publicId: String
  },
  duration: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  language: {
    type: String,
    default: 'English'
  },
  enrolledStudents: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  features: [String],
  requirements: [String],
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate final price
courseSchema.virtual('finalPrice').get(function() {
  return this.price - (this.price * this.discount / 100);
});

// Virtual populate for course modules
courseSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'courseId'
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

const Course = mongoose.model('Course', courseSchema);

export default Course;
