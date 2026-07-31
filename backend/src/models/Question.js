import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  points: { type: Number, default: 1 },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  type: { 
    type: String, 
    enum: ['MCQ', 'true/false', 'fill_blanks', 'short_answer', 'long_answer'], 
    default: 'MCQ',
    index: true 
  },
  difficulty: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'], 
    default: 'Beginner',
    index: true 
  }
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
export default Question;
