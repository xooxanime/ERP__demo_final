import mongoose from 'mongoose';

const assessmentQuestionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
  originalQuestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  points: { type: Number, default: 1 }
}, { timestamps: true });

const AssessmentQuestion = mongoose.model('AssessmentQuestion', assessmentQuestionSchema);
export default AssessmentQuestion;
