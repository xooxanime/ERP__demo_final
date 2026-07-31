import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  qualification: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  image: {
    url: String,
    publicId: String
  },
  subjects: [{
    type: String
  }],
  achievements: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Faculty = mongoose.model('Faculty', facultySchema);

export default Faculty;
