import mongoose from 'mongoose';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Assessment from '../models/Assessment.js';
import AssessmentQuestion from '../models/AssessmentQuestion.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import ExamScore from '../models/ExamScore.js';
import Question from '../models/Question.js';
import AcademicSession from '../models/AcademicSession.js';
import SystemAuditLog from '../models/SystemAuditLog.js';
import Attendance from '../models/Attendance.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { extractQuizQuestionsFromText } from '../services/grokService.js';

// Helper to sync batch course enrollments for all students in the batch
const syncBatchEnrollments = async (batch) => {
  try {
    const courseIds = batch.courses || [];
    const studentIds = batch.students || [];

    if (courseIds.length === 0) {
      return;
    }
    
    // Create an enrollment for every student and course in the batch if it doesn't exist
    if (studentIds.length > 0) {
      for (const studentId of studentIds) {
        for (const courseId of courseIds) {
          await Enrollment.findOneAndUpdate(
            { studentId, courseId },
            { 
              $setOnInsert: { 
                studentId, 
                courseId,
                status: 'active',
                progress: 0,
                completedVideos: [],
                enrollmentDate: new Date()
              } 
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    // Clean up enrollments for students that are no longer in this batch for the batch's courses
    await Enrollment.deleteMany({
      courseId: { $in: courseIds },
      studentId: { $nin: studentIds }
    });
  } catch (error) {
    console.error('Error syncing batch enrollments:', error.message);
  }
};

// ==========================================
// ADMIN BATCH MANAGEMENT
// ==========================================

// @desc    Create a batch
// @route   POST /api/batches
// @access  Private (Admin)
export const createBatch = async (req, res) => {
  try {
    const { name, description, teachers, batchManager, canManageStudents } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a batch name'
      });
    }

    const existingBatch = await Batch.findOne({ name });
    if (existingBatch) {
      return res.status(400).json({
        status: 'error',
        message: 'A batch with this name already exists'
      });
    }

    const activeSession = await AcademicSession.findOne({ isActive: true });
    if (!activeSession) {
      return res.status(400).json({
        status: 'error',
        message: 'No active academic session found. Create an academic session first.'
      });
    }

    const batch = await Batch.create({
      name,
      description,
      academicSessionId: activeSession._id,
      teachers: teachers || [],
      students: [], // Scalable enrollment flow, Batch Manager will add
      courses: [], // Teachers will create courses in the batch
      batchManager: batchManager || null,
      canManageStudents: canManageStudents || false,
      createdBy: req.user.id
    });

    // Sync enrollments in the background
    await syncBatchEnrollments(batch);

    res.status(201).json({
      status: 'success',
      data: { batch }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private (Admin, Teacher)
export const getAllBatches = async (req, res) => {
  try {
    let query = {};
    
    // If teacher, only return their assigned batches
    if (req.user.role === 'teacher') {
      query.teachers = req.user.id;
    }

    const batches = await Batch.find(query)
      .populate('teachers', 'name email phone')
      .populate('students', 'name email phone')
      .populate('courses', 'title category instructor')
      .populate('batchManager', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: batches.length,
      data: { batches }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single batch details
// @route   GET /api/batches/:id
// @access  Private (Admin, Teacher, Student)
export const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('teachers', 'name email phone')
      .populate('students', 'name email phone')
      .populate('courses', 'title description thumbnail duration instructor category')
      .populate('batchManager', 'name email phone');

    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Role check: Teachers and Students must belong to this batch
    const isTeacherAssigned = batch.teachers.some(t => t._id.toString() === req.user.id) ||
                              (batch.batchManager && (batch.batchManager._id || batch.batchManager).toString() === req.user.id);
    if (req.user.role === 'teacher' && !isTeacherAssigned) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this batch'
      });
    }

    if (req.user.role === 'student' && !batch.students.some(s => s._id.toString() === req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this batch'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { batch }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update a batch
// @route   PUT /api/batches/:id
// @access  Private (Admin)
export const updateBatch = async (req, res) => {
  try {
    const { name, description, teachers, batchManager, canManageStudents } = req.body;

    let batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Prevent name duplicates when changing batch name
    if (name && name !== batch.name) {
      const nameExists = await Batch.findOne({ name });
      if (nameExists) {
        return res.status(400).json({
          status: 'error',
          message: 'A batch with this name already exists'
        });
      }
    }

    batch.name = name || batch.name;
    batch.description = description !== undefined ? description : batch.description;
    batch.teachers = teachers || batch.teachers;
    batch.batchManager = batchManager !== undefined ? (batchManager || null) : batch.batchManager;
    batch.canManageStudents = canManageStudents !== undefined ? canManageStudents : batch.canManageStudents;

    await batch.save();
    
    // Sync enrollments
    await syncBatchEnrollments(batch);

    // Populate returned data
    batch = await batch.populate([
      { path: 'teachers', select: 'name email phone' },
      { path: 'students', select: 'name email phone' },
      { path: 'courses', select: 'title category instructor' },
      { path: 'batchManager', select: 'name email phone' }
    ]);

    res.status(200).json({
      status: 'success',
      data: { batch }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete a batch
// @route   DELETE /api/batches/:id
// @access  Private (Admin)
export const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);

    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Batch removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user lists for select inputs (students & teachers)
// @route   GET /api/batches/users/list
// @access  Private (Admin)
export const getBatchUsersList = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }, 'name email approvalStatus');
    const students = await User.find({ role: 'student' }, 'name email approvalStatus isActive');
    const courses = await Course.find({}, 'title category isPublished');

    res.status(200).json({
      status: 'success',
      data: {
        teachers,
        students,
        courses
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


// ==========================================
// COURSE MANAGEMENT INSIDE BATCH
// ==========================================

// @desc    Create a course inside a batch
// @route   POST /api/batches/:batchId/courses
// @access  Private (Teacher, Admin)
export const createCourseInBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { title, description, category, price, duration, level, language } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Role check: Only teachers can create courses inside a batch (no admins)
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        status: 'error',
        message: 'Only teachers can create courses inside batches'
      });
    }

    // Role check: Teachers must belong to the batch or be the batch manager
    const isAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                       (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (!isAssigned) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this batch'
      });
    }

    // Create course
    const course = await Course.create({
      title,
      description,
      category,
      price: price || 0,
      duration: duration || '3 months',
      level: level || 'Beginner',
      language: language || 'English',
      instructor: req.user.name,
      thumbnail: {
        url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop'
      },
      isPublished: true,
      batch: batch._id,
      creator: req.user.id
    });

    // Add course to batch
    batch.courses.push(course._id);
    await batch.save();

    // Sync student enrollments for this new course
    await syncBatchEnrollments(batch);

    res.status(201).json({
      status: 'success',
      data: { course }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update batch students (Batch Manager Delegation)
// @route   POST /api/batches/:batchId/students
// @access  Private (Teacher - Batch Manager with permission)
export const manageBatchStudents = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { students } = req.body; // Array of student IDs

    if (!Array.isArray(students)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid list of student IDs'
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Role check: Must be admin or the batch manager for this batch and must have canManageStudents permission
    const isAdmin = req.user.role === 'admin';
    const isBatchManager = batch.batchManager && batch.batchManager.toString() === req.user.id;
    const canManage = batch.canManageStudents;

    if (!isAdmin && (!isBatchManager || !canManage)) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to manage student enrollment for this batch'
      });
    }

    // Filter and check if all student IDs are valid student users
    const validStudents = await User.find({
      _id: { $in: students },
      role: 'student'
    });

    batch.students = validStudents.map(s => s._id);
    await batch.save();

    // Sync student enrollments for all courses in this batch
    await syncBatchEnrollments(batch);

    res.status(200).json({
      status: 'success',
      message: 'Batch students updated successfully',
      data: {
        students: batch.students
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


// ==========================================
// ASSIGNMENT FLOW
// ==========================================

// @desc    Create a batch/course assignment
// @route   POST /api/batches/assignments
// @access  Private (Teacher, Admin)
export const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, courseId, batchId, attachments } = req.body;

    if (!title || !description || !dueDate || !courseId || !batchId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please fill in all required fields'
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Check if teacher is assigned to batch or is the batch manager
    const isTeacherAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (req.user.role === 'teacher' && !isTeacherAssigned) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to create assignments for this batch'
      });
    }

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      courseId,
      batchId,
      attachments: attachments || [],
      createdBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { assignment }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get assignments for a batch
// @route   GET /api/batches/:batchId/assignments
// @access  Private (Teacher, Student, Admin)
export const getBatchAssignments = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findById(batchId);
    
    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Check authorization
    const isTeacherAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (req.user.role === 'teacher' && !isTeacherAssigned) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this batch'
      });
    }
    if (req.user.role === 'student' && !batch.students.some(s => s.toString() === req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this batch'
      });
    }

    // Resolve all courses associated with this batch in both directions
    const courses = await Course.find({
      $or: [
        { batch: batchId },
        { _id: { $in: batch.courses || [] } }
      ]
    });
    const courseIds = courses.map(c => c._id);

    const assignments = await Assignment.find({
      $or: [
        { batchId: batchId },
        { 
          batchId: { $in: [null, undefined] },
          courseId: { $in: courseIds }
        },
        {
          batchId: { $exists: false },
          courseId: { $in: courseIds }
        }
      ]
    })
      .populate('courseId', 'title')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    // If student, attach submission status for each assignment
    let result = assignments;
    if (req.user.role === 'student') {
      const submissions = await Submission.find({ studentId: req.user.id, assignmentId: { $in: assignments.map(a => a._id) } });
      
      result = assignments.map(a => {
        const sub = submissions.find(s => s.assignmentId.toString() === a._id.toString());
        const plainA = a.toObject();
        plainA.submission = sub || null;
        plainA.isOverdue = new Date() > new Date(a.dueDate) && !sub;
        return plainA;
      });
    }

    res.status(200).json({
      status: 'success',
      results: result.length,
      data: { assignments: result }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Submit an assignment
// @route   POST /api/batches/assignments/:assignmentId/submit
// @access  Private (Student)
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content, attachments } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Verify student is in batch or enrolled in course
    if (assignment.batchId) {
      const batch = await Batch.findById(assignment.batchId);
      if (batch && !batch.students.some(s => s.toString() === req.user.id)) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to submit for this assignment'
        });
      }
    } else if (assignment.courseId) {
      const enrollment = await Enrollment.findOne({ studentId: req.user.id, courseId: assignment.courseId });
      if (!enrollment) {
        return res.status(403).json({
          status: 'error',
          message: 'You must be enrolled in this course to submit this assignment'
        });
      }
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    const submissionStatus = isLate ? 'late' : 'submitted';

    // Check if already submitted
    const existingSubmission = await Submission.findOne({ assignmentId, studentId: req.user.id });
    if (existingSubmission) {
      if (existingSubmission.status === 'graded') {
        return res.status(400).json({
          status: 'error',
          message: 'This assignment has already been graded and cannot be modified'
        });
      }

      existingSubmission.content = content || '';
      existingSubmission.attachments = attachments || [];
      existingSubmission.status = submissionStatus;
      existingSubmission.submittedAt = Date.now();
      await existingSubmission.save();

      return res.status(200).json({
        status: 'success',
        message: 'Submission updated successfully',
        data: { submission: existingSubmission }
      });
    }

    const submission = await Submission.create({
      assignmentId,
      studentId: req.user.id,
      content: content || '',
      attachments: attachments || [],
      status: submissionStatus,
      submittedAt: Date.now()
    });

    res.status(201).json({
      status: 'success',
      data: { submission }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get submissions for an assignment
// @route   GET /api/batches/assignments/:assignmentId/submissions
// @access  Private (Teacher, Admin)
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    // Check role/batch matching
    const batch = await Batch.findById(assignment.batchId);
    const isTeacherAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (req.user.role === 'teacher' && !isTeacherAssigned) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view submissions for this batch'
      });
    }

    const submissions = await Submission.find({ assignmentId })
      .populate('studentId', 'name email phone')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: submissions.length,
      data: { submissions }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Grade submission
// @route   POST /api/batches/assignments/submissions/:submissionId/grade
// @access  Private (Teacher)
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await Submission.findById(submissionId).populate('assignmentId');
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found'
      });
    }

    // Auth check
    const batch = await Batch.findById(submission.assignmentId.batchId);
    const isTeacherAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (!isTeacherAssigned) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to grade this submission'
      });
    }

    submission.grade = grade || '';
    submission.feedback = feedback || '';
    submission.status = req.body.status === 'returned' ? 'returned' : 'graded';
    await submission.save();

    res.status(200).json({
      status: 'success',
      data: { submission }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


// ==========================================
// QUIZ FLOW
// ==========================================

// @desc    Extract quiz questions from PDF
// @route   POST /api/batches/quizzes/extract-questions
// @access  Private (Teacher, Admin)
export const extractQuestionsFromPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload a PDF file'
      });
    }

    console.log('🔄 Parsing PDF text content...');
    let text = '';
    try {
      const parseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse && pdfParse.default ? pdfParse.default : pdfParse);
      const result = await parseFn(req.file.buffer);
      text = result?.text || '';
    } catch (parseError) {
      console.warn('pdfParse failed during text extraction:', parseError);
      return res.status(400).json({
        status: 'error',
        message: 'Could not parse the PDF. Please upload a valid text-based PDF.'
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No readable text found. Please upload a text-based PDF.'
      });
    }

    console.log(`✅ Extracted ${text.trim().length} characters of readable text. Extracting questions using AI...`);
    let questions = [];
    try {
      questions = await extractQuizQuestionsFromText(text);
    } catch (aiError) {
      console.error('AI quiz question extraction failed, falling back to regex extraction:', aiError);
      questions = extractQuestionsRegex(text);
    }

    if (!questions || questions.length === 0) {
      questions = extractQuestionsRegex(text);
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Could not extract valid MCQs from this PDF.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { questions }
    });
  } catch (error) {
    console.error('Error in extractQuestionsFromPdf:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


// Local rule-based regex fallback question extractor
function extractQuestionsRegex(text) {
  console.log("Running regex fallback question extraction...");
  const questions = [];
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let currentQuestion = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match starts with digit like "1. ", "2) ", "Q3: "
    const questionMatch = line.match(/^(?:(?:Q|Question)\s*\d+[:\-\.]|\d+[:\-\.\)])\s*(.+)$/i);
    
    if (questionMatch) {
      if (currentQuestion && currentQuestion.options.length >= 2) {
        while (currentQuestion.options.length < 4) {
          currentQuestion.options.push(`Option ${currentQuestion.options.length + 1}`);
        }
        questions.push(currentQuestion);
      }
      
      currentQuestion = {
        questionText: questionMatch[1].trim(),
        options: [],
        correctOptionIndex: 0,
        points: 1
      };
    } else if (currentQuestion) {
      // Match option indicators like "A. ", "b) ", "(c) ", "[D]"
      const optionMatch = line.match(/^(?:[A-D]\s*[\.\-\)]|[a-d]\s*[\.\-\)]|\[[A-D]\]|\(\s*[A-D]\s*\))\s*(.+)$/);
      if (optionMatch) {
        currentQuestion.options.push(optionMatch[1].trim());
      } else {
        if (currentQuestion.options.length === 0) {
          currentQuestion.questionText += ' ' + line;
        }
      }
    }
  }
  
  if (currentQuestion && currentQuestion.options.length >= 2) {
    while (currentQuestion.options.length < 4) {
      currentQuestion.options.push(`Option ${currentQuestion.options.length + 1}`);
    }
    questions.push(currentQuestion);
  }
  
  // If regex found no structured questions, extract sentence-based MCQs ONLY from real readable text
  if (questions.length === 0 && text && text.trim().length > 30) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const cleanSentences = sentences.map(s => s.trim()).filter(s => s.length > 20 && s.length < 160);
    
    for (let i = 0; i < Math.min(5, cleanSentences.length); i++) {
      questions.push({
        questionText: `According to the document text: "${cleanSentences[i]}", which statement is accurate?`,
        options: [
          `The statement "${cleanSentences[i]}" is supported by the document`,
          "This statement directly contradicts the document",
          "The document states the opposite conclusion",
          "Not specified in the document"
        ],
        correctOptionIndex: 0,
        points: 1
      });
    }
  }
  
  return questions;
}

// @desc    Create a batch/course quiz
// @route   POST /api/batches/quizzes
// @access  Private (Teacher, Admin)
export const createQuiz = async (req, res) => {
  try {
    const { title, description, courseId, batchId, dueDate, duration, questions } = req.body;

    if (!title || !courseId || !batchId || !dueDate || !questions || questions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please fill in all required fields'
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Auth check
    const isTeacherAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (req.user.role === 'teacher' && !isTeacherAssigned) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to create quizzes for this batch'
      });
    }

    const quiz = await Quiz.create({
      title,
      description: description || '',
      courseId,
      batchId,
      dueDate,
      duration: duration || 30,
      questions,
      createdBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { quiz }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get quizzes for a batch
// @route   GET /api/batches/:batchId/quizzes
// @access  Private (Teacher, Student, Admin)
export const getBatchQuizzes = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Auth check
    const isTeacherAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (req.user.role === 'teacher' && !isTeacherAssigned) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this batch'
      });
    }
    if (req.user.role === 'student' && !batch.students.some(s => s.toString() === req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this batch'
      });
    }

    // Resolve all courses associated with this batch in both directions
    const courses = await Course.find({
      $or: [
        { batch: batchId },
        { _id: { $in: batch.courses || [] } }
      ]
    });
    const courseIds = courses.map(c => c._id);

    const quizzes = await Quiz.find({
      $or: [
        { batchId: batchId },
        {
          batchId: { $in: [null, undefined] },
          courseId: { $in: courseIds }
        },
        {
          batchId: { $exists: false },
          courseId: { $in: courseIds }
        }
      ]
    })
      .populate('courseId', 'title')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    // If student, attach attempt status and score, and hide correct answers unless attempted or overdue
    let result = quizzes;
    if (req.user.role === 'student') {
      const attempts = await QuizAttempt.find({ studentId: req.user.id, quizId: { $in: quizzes.map(q => q._id) } });

      result = quizzes.map(q => {
        const attempt = attempts.find(att => att.quizId.toString() === q._id.toString());
        const plainQ = q.toObject();
        plainQ.attempt = attempt || null;
        plainQ.isOverdue = new Date() > new Date(q.dueDate) && !attempt;
        
        // Hide correct option index if not attempted yet and still before deadline
        if (!attempt && new Date() < new Date(q.dueDate)) {
          plainQ.questions = plainQ.questions.map(quest => {
            const { correctOptionIndex, ...rest } = quest;
            return rest;
          });
        }
        return plainQ;
      });
    }

    res.status(200).json({
      status: 'success',
      results: result.length,
      data: { quizzes: result }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Attempt/submit quiz responses
// @route   POST /api/batches/quizzes/:quizId/attempt
// @access  Private (Student)
export const attemptQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of selected option indices corresponding to questions

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Verify student is in batch
    const batch = await Batch.findById(quiz.batchId);
    if (!batch || !batch.students.some(s => s.toString() === req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to attempt this quiz'
      });
    }

    // Check if already attempted
    const existingAttempt = await QuizAttempt.findOne({ quizId, studentId: req.user.id });
    if (existingAttempt) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already attempted this quiz'
      });
    }

    // Calculate score with question ID answer mapping
    let score = 0;
    let totalPoints = 0;

    quiz.questions.forEach((question, idx) => {
      const qId = (question._id || question.id || idx).toString();
      let studentAnswer = undefined;

      if (answers && typeof answers === 'object' && !Array.isArray(answers)) {
        studentAnswer = answers[qId] !== undefined ? answers[qId] : answers[idx];
      } else if (Array.isArray(answers)) {
        const matchingAnsObj = answers.find(a => a && typeof a === 'object' && (a.questionId === qId || a._id === qId));
        if (matchingAnsObj) {
          studentAnswer = matchingAnsObj.selectedOption !== undefined ? matchingAnsObj.selectedOption : matchingAnsObj.answer;
        } else {
          studentAnswer = answers[idx];
        }
      }

      const correctOption = question.correctOptionIndex;
      totalPoints += question.points || 1;

      if (studentAnswer !== undefined && studentAnswer !== null && Number(studentAnswer) === Number(correctOption)) {
        score += question.points || 1;
      }
    });

    const attempt = await QuizAttempt.create({
      quizId,
      studentId: req.user.id,
      answers,
      score,
      totalPoints,
      status: 'completed'
    });

    res.status(201).json({
      status: 'success',
      data: { attempt, quiz }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get attempts for a quiz
// @route   GET /api/batches/quizzes/:quizId/attempts
// @access  Private (Teacher, Admin)
export const getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        status: 'error',
        message: 'Quiz not found'
      });
    }

    // Check role/batch matching
    const batch = await Batch.findById(quiz.batchId);
    const isTeacherAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (req.user.role === 'teacher' && !isTeacherAssigned) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view attempts for this batch'
      });
    }

    const attempts = await QuizAttempt.find({ quizId })
      .populate('studentId', 'name email phone')
      .sort({ score: -1 });

    res.status(200).json({
      status: 'success',
      results: attempts.length,
      data: { attempts }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


// ==========================================
// STUDENT BATCH INFO
// ==========================================

// @desc    Get student's active batch details
// @route   GET /api/batches/student/my-batch
// @access  Private (Student)
export const getStudentBatch = async (req, res) => {
  try {
    const batch = await Batch.findOne({ students: req.user.id })
      .populate('teachers', 'name email avatar')
      .populate('courses', 'title description instructor category duration level thumbnail');

    if (!batch) {
      return res.status(200).json({
        status: 'success',
        data: { batch: null }
      });
    }

    res.status(200).json({
      status: 'success',
      data: { batch }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


// ==========================================
// PARENT BATCH & PROGRESS INFO
// ==========================================

// @desc    Get progress tracking of a child
// @route   GET /api/batches/parent/student-progress/:studentId
// @access  Private (Parent)
export const getParentStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify parent is linked to this student
    if (req.user.role === 'parent' && req.user.parentInfo?.studentId?.toString() !== studentId) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this student\'s progress'
      });
    }

    const studentBatch = await Batch.findOne({ students: studentId })
      .populate('courses', 'title');

    const enrollments = await Enrollment.find({ studentId })
      .populate('courseId', 'title instructor category');

    const assignmentsCount = await Assignment.countDocuments({ batchId: studentBatch?._id });
    const submissions = await Submission.find({ studentId });
    const quizzesCount = await Quiz.countDocuments({ batchId: studentBatch?._id });
    const quizAttempts = await QuizAttempt.find({ studentId });

    res.status(200).json({
      status: 'success',
      data: {
        batch: studentBatch ? { _id: studentBatch._id, name: studentBatch.name } : null,
        enrollments,
        stats: {
          assignments: {
            total: assignmentsCount,
            submitted: submissions.length,
            graded: submissions.filter(s => s.status === 'graded').length
          },
          quizzes: {
            total: quizzesCount,
            attempted: quizAttempts.length,
            avgScore: quizAttempts.length > 0 ? (quizAttempts.reduce((acc, curr) => acc + (curr.score / curr.totalPoints), 0) / quizAttempts.length) * 100 : 0
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// UNIFIED ASSESSMENT ENGINE (Online & Offline)
// ==========================================

// Helper to audit events
const auditLog = async (action, userId, targetType, targetId, oldValues, newValues, session) => {
  try {
    const currentSession = await AcademicSession.findOne({ isActive: true });
    await SystemAuditLog.create([{
      action,
      performedBy: userId,
      academicSessionId: currentSession?._id,
      targetType,
      targetId,
      oldValues,
      newValues
    }], { session });
  } catch (err) {
    console.error('⚠️ Failed to save system audit log:', err.message);
  }
};

// Helper for CBSE grade mapping
export const calculateGradeAndGP = (percentage) => {
  if (percentage >= 91) return { grade: 'A1', gp: 10 };
  if (percentage >= 81) return { grade: 'A2', gp: 9 };
  if (percentage >= 71) return { grade: 'B1', gp: 8 };
  if (percentage >= 61) return { grade: 'B2', gp: 7 };
  if (percentage >= 51) return { grade: 'C1', gp: 6 };
  if (percentage >= 41) return { grade: 'C2', gp: 5 };
  if (percentage >= 33) return { grade: 'D', gp: 4 };
  return { grade: 'E', gp: 0 };
};

// @desc    Create Assessment (quiz/exam/CT1/CT2 etc.)
// @route   POST /api/v1/batches/assessments
// @access  Private (Teacher, Admin)
export const createAssessment = async (req, res) => {
  try {
    const { title, description, type, deliveryMode, academicSessionId, courseId, batchId, dueDate, duration, totalMarks, passingMarks, negativeMarking, questionIds } = req.body;

    if (!title || !type || !academicSessionId || !courseId || !batchId || !dueDate || !totalMarks || !passingMarks) {
      return res.status(400).json({ status: 'error', message: 'Please fill in all required fields' });
    }

    // Strict validation: academicSessionId must be a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(academicSessionId)) {
      return res.status(400).json({ status: 'error', message: 'academicSessionId must be a valid 24-character hexadecimal ObjectId' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ status: 'error', message: 'Batch not found' });
    }

    // Auth check
    const isTeacherAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (req.user.role === 'teacher' && !isTeacherAssigned) {
      return res.status(403).json({ status: 'error', message: 'You are not assigned to this batch' });
    }

    const result = await runInTransaction(async (session) => {
      // 1. Create core assessment metadata
      const [assessment] = await Assessment.create([{
        title,
        description: description || '',
        type,
        deliveryMode: deliveryMode || 'online',
        academicSessionId,
        courseId,
        batchId,
        dueDate,
        duration: duration || 30,
        totalMarks,
        passingMarks,
        negativeMarking: negativeMarking || false,
        createdBy: req.user.id
      }], { session });

      // 2. Snapshot questions from question bank if online mode and questionIds are provided
      if (deliveryMode !== 'offline' && questionIds && questionIds.length > 0) {
        const questionsFromBank = await Question.find({ _id: { $in: questionIds } });
        if (questionsFromBank.length > 0) {
          const snapshotOps = questionsFromBank.map(q => ({
            assessmentId: assessment._id,
            originalQuestionId: q._id,
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            points: q.points
          }));

          await AssessmentQuestion.create(snapshotOps, { session });
        }
      }

      await auditLog('assessment_created', req.user.id, 'Assessment', assessment._id, null, assessment.toObject(), session);

      return assessment;
    });

    res.status(201).json({ status: 'success', message: 'Assessment created successfully', data: { assessment: result } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get Assessments for a batch
// @route   GET /api/v1/batches/:batchId/assessments
// @access  Private (Teacher, Student, Parent, Admin)
export const getBatchAssessments = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { academicSessionId } = req.query;

    const query = { batchId, isDeleted: false };
    if (academicSessionId) query.academicSessionId = academicSessionId;

    const assessments = await Assessment.find(query)
      .populate('courseId', 'title')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    // If student, attach attempt status or hides correct index
    let result = assessments;
    if (req.user.role === 'student') {
      const attempts = await AssessmentAttempt.find({ studentId: req.user.id, assessmentId: { $in: assessments.map(a => a._id) } });
      const manualScores = await ExamScore.find({ studentId: req.user.id, assessmentId: { $in: assessments.map(a => a._id) } });

      result = assessments.map(a => {
        const attempt = attempts.find(att => att.assessmentId.toString() === a._id.toString());
        const manualScore = manualScores.find(ms => ms.assessmentId.toString() === a._id.toString());
        const plainA = a.toObject();
        plainA.attempt = attempt || null;
        plainA.score = manualScore || null;
        plainA.isOverdue = new Date() > new Date(a.dueDate) && !attempt && !manualScore;
        return plainA;
      });
    }

    res.status(200).json({ status: 'success', results: result.length, data: { assessments: result } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Attempt/submit online assessment answers
// @route   POST /api/v1/batches/assessments/:assessmentId/attempt
// @access  Private (Student)
export const attemptAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { answers } = req.body; // array of { questionId, selectedOptionIndex }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment || assessment.isDeleted) {
      return res.status(404).json({ status: 'error', message: 'Assessment not found' });
    }

    if (assessment.deliveryMode === 'offline') {
      return res.status(400).json({ status: 'error', message: 'This is an offline exam and cannot be attempted online.' });
    }

    // Check if already attempted
    const existingAttempt = await AssessmentAttempt.findOne({ assessmentId, studentId: req.user.id });
    if (existingAttempt) {
      return res.status(400).json({ status: 'error', message: 'You have already attempted this assessment.' });
    }

    const result = await runInTransaction(async (session) => {
      // Load snapshotted questions
      const examQuestions = await AssessmentQuestion.find({ assessmentId }).session(session);

      let score = 0;
      let totalPoints = 0;

      answers.forEach(ans => {
        const eq = examQuestions.find(q => q._id.toString() === ans.questionId || q.originalQuestionId.toString() === ans.questionId);
        if (eq) {
          totalPoints += eq.points || 1;
          if (eq.correctOptionIndex === ans.selectedOptionIndex) {
            score += eq.points || 1;
          } else if (assessment.negativeMarking) {
            // Apply simple 0.25 negative marks correction
            score -= (eq.points || 1) * 0.25;
          }
        }
      });

      // Clamp score to 0
      if (score < 0) score = 0;

      // Save Attempt
      const [attempt] = await AssessmentAttempt.create([{
        assessmentId,
        studentId: req.user.id,
        answers,
        status: 'submitted',
        timeRemaining: 0,
        score,
        totalPoints,
        submittedAt: Date.now()
      }], { session });

      // Auto-compute CBSE grades
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      const { grade, gp } = calculateGradeAndGP(percentage);
      const passStatus = percentage >= (assessment.passingMarks / assessment.totalMarks * 100) ? 'pass' : 'fail';

      // Save consolidated score
      const [examScore] = await ExamScore.create([{
        assessmentId,
        studentId: req.user.id,
        academicSessionId: assessment.academicSessionId,
        marksObtained: score,
        graceMarks: 0,
        moderatedMarks: 0,
        finalScore: score,
        percentage: Math.round(percentage),
        grade,
        gradePoint: gp,
        passStatus,
        remarks: 'Auto-graded online attempt',
        gradedBy: assessment.createdBy
      }], { session });

      await auditLog('assessment_attempt_submitted', req.user.id, 'AssessmentAttempt', attempt._id, null, attempt.toObject(), session);

      return { attempt, examScore };
    });

    res.status(201).json({ status: 'success', message: 'Assessment submitted successfully!', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Submit marks manually for offline exams (Bulk operation)
// @route   POST /api/v1/batches/assessments/:examId/scores
// @access  Private (Teacher)
export const submitAssessmentScores = async (req, res) => {
  try {
    const { examId } = req.params;
    const { scores } = req.body; // array of { studentId, marksObtained, graceMarks, moderatedMarks, remarks }

    const assessment = await Assessment.findById(examId);
    if (!assessment || assessment.isDeleted) {
      return res.status(404).json({ status: 'error', message: 'Assessment not found' });
    }

    const batch = await Batch.findById(assessment.batchId);
    const isTeacherAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (!isTeacherAssigned && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'You are not authorized to grade this batch' });
    }

    await runInTransaction(async (session) => {
      const bulkOps = scores.map(s => {
        const rawFinal = (s.marksObtained || 0) + (s.graceMarks || 0) + (s.moderatedMarks || 0);
        const finalScore = Math.min(rawFinal, assessment.totalMarks);
        const percentage = assessment.totalMarks > 0 ? (finalScore / assessment.totalMarks) * 100 : 0;
        const { grade, gp } = calculateGradeAndGP(percentage);
        const passStatus = finalScore >= assessment.passingMarks ? 'pass' : 'fail';

        return {
          updateOne: {
            filter: { assessmentId: examId, studentId: s.studentId },
            update: {
              $set: {
                academicSessionId: assessment.academicSessionId,
                marksObtained: s.marksObtained,
                graceMarks: s.graceMarks || 0,
                moderatedMarks: s.moderatedMarks || 0,
                finalScore,
                percentage: Math.round(percentage),
                grade,
                gradePoint: gp,
                passStatus,
                remarks: s.remarks || '',
                gradedBy: req.user.id,
                gradedAt: Date.now()
              }
            },
            upsert: true
          }
        };
      });

      await ExamScore.bulkWrite(bulkOps, { session });
      await auditLog('assessment_marks_updated', req.user.id, 'Assessment', assessment._id, null, { scoresCount: scores.length }, session);
    });

    res.status(200).json({ status: 'success', message: 'Student marks updated successfully!' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get assessment scores sheet
// @route   GET /api/v1/batches/assessments/:examId/scores
// @access  Private (Teacher, Admin)
export const getAssessmentScores = async (req, res) => {
  try {
    const { examId } = req.params;
    const scores = await ExamScore.find({ assessmentId: examId })
      .populate('studentId', 'name email phone')
      .sort({ finalScore: -1 });

    res.status(200).json({ status: 'success', results: scores.length, data: { scores } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get student scorecard results
// @route   GET /api/v1/batches/student/results
// @access  Private (Student)
export const getStudentResults = async (req, res) => {
  try {
    const scores = await ExamScore.find({ studentId: req.user.id })
      .populate({
        path: 'assessmentId',
        select: 'title type totalMarks passingMarks deliveryMode courseId',
        populate: { path: 'courseId', select: 'title' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', data: { results: scores } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get parent linked child results
// @route   GET /api/v1/batches/parent/results/:studentId
// @access  Private (Parent)
export const getParentStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Link check
    if (req.user.parentInfo?.studentId?.toString() !== studentId) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to view this child results' });
    }

    const scores = await ExamScore.find({ studentId })
      .populate({
        path: 'assessmentId',
        select: 'title type totalMarks passingMarks deliveryMode courseId',
        populate: { path: 'courseId', select: 'title' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', data: { results: scores } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// ATTENDANCE MANAGEMENT
// ==========================================

// @desc    Submit or update batch student attendance
// @route   POST /api/batches/:batchId/attendance
// @access  Private (Teacher, Admin)
export const submitBatchAttendance = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { courseId, date, attendanceRecords } = req.body; // Array of { studentId, status }

    if (!date || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid date and attendance records'
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Role check: Admin or assigned teacher or batch manager
    const isAdmin = req.user.role === 'admin';
    const isAssignedTeacher = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (!isAdmin && !isAssignedTeacher) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to mark attendance for this batch'
      });
    }

    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Save/update attendance records
    for (const record of attendanceRecords) {
      const { studentId, status } = record;

      // Verify student is in batch
      if (!batch.students.some(s => s.toString() === studentId)) {
        continue;
      }

      const query = {
        studentId,
        batchId,
        date: normalizedDate
      };

      if (courseId) {
        query.courseId = courseId;
      } else {
        query.courseId = null; // general batch attendance
      }

      await Attendance.findOneAndUpdate(
        query,
        {
          teacherId: req.user.id,
          status,
          academicSessionId: batch.academicSessionId,
          joinedAt: new Date(),
          durationMinutes: 0
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Attendance saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get batch student attendance for a date/course
// @route   GET /api/batches/:batchId/attendance
// @access  Private (Teacher, Admin)
export const getBatchAttendance = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { courseId, date } = req.query;

    if (!date) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid date'
      });
    }

    const batch = await Batch.findById(batchId).populate('students', 'name email phone');
    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    // Role check: Admin or assigned teacher or batch manager
    const isAdmin = req.user.role === 'admin';
    const isAssignedTeacher = batch.teachers.some(t => t.toString() === req.user.id) ||
                              (batch.batchManager && batch.batchManager.toString() === req.user.id);
    if (!isAdmin && !isAssignedTeacher) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view attendance for this batch'
      });
    }

    // Normalize date
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const query = {
      $or: [
        { batchId: batchId },
        { batchId: { $exists: false } },
        { batchId: null }
      ],
      date: normalizedDate
    };

    if (courseId) {
      query.courseId = courseId;
    } else {
      query.courseId = null;
    }

    const records = await Attendance.find(query);

    // Map students with their attendance status
    const attendance = batch.students.map(student => {
      const record = records.find(r => r.studentId.toString() === student._id.toString());
      return {
        studentId: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        status: record ? record.status : null // null means not marked yet
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        attendance
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get student attendance statistics
// @route   GET /api/batches/student/attendance
// @access  Private (Student)
export const getStudentAttendance = async (req, res) => {
  try {
    const studentBatch = await Batch.findOne({ students: req.user.id });
    if (!studentBatch) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }

    const records = await Attendance.find({
      studentId: req.user.id,
      $or: [
        { batchId: studentBatch._id },
        { batchId: { $exists: false } },
        { batchId: null }
      ]
    })
      .populate('courseId', 'title')
      .populate('teacherId', 'name');

    // Group and calculate statistics
    const courseAttendance = {};
    if (studentBatch.courses) {
      const courses = await Course.find({ _id: { $in: studentBatch.courses } });
      for (const course of courses) {
        courseAttendance[course._id.toString()] = {
          courseId: course._id,
          courseTitle: course.title,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          total: 0
        };
      }
    }

    // Default general general attendance key if present
    courseAttendance['general'] = {
      courseId: null,
      courseTitle: 'General/Live Session',
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      total: 0
    };

    for (const record of records) {
      const courseIdStr = record.courseId ? (record.courseId._id || record.courseId).toString() : 'general';
      if (!courseAttendance[courseIdStr]) {
        courseAttendance[courseIdStr] = {
          courseId: record.courseId?._id || null,
          courseTitle: record.courseId?.title || 'General/Live Session',
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          total: 0
        };
      }
      courseAttendance[courseIdStr].total++;
      if (['present', 'absent', 'late', 'leave'].includes(record.status)) {
        courseAttendance[courseIdStr][record.status]++;
      }
    }

    // Filter out empty general entry if no records exist for it
    if (courseAttendance['general'].total === 0) {
      delete courseAttendance['general'];
    }

    const summary = Object.values(courseAttendance).map(c => {
      const attended = c.present + c.late + c.leave;
      const percentage = c.total > 0 ? Math.round((attended / c.total) * 100) : 100;
      return {
        ...c,
        percentage
      };
    });

    res.status(200).json({
      status: 'success',
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
