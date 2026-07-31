import Progress from '../models/Progress.js';
import Course from '../models/Course.js';

// @desc    Get student progress for a course
// @route   GET /api/student/progress/:courseId
// @access  Private
export const getCourseProgress = async (req, res) => {
  try {
    let progress = await Progress.findOne({
      student: req.user.id,
      course: req.params.courseId
    }).populate('course', 'title');
    
    if (!progress) {
      // Create new progress record
      const course = await Course.findById(req.params.courseId);
      progress = await Progress.create({
        student: req.user.id,
        course: req.params.courseId,
        totalVideos: course.modules?.length || 0
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { progress }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all progress for student
// @route   GET /api/student/progress
// @access  Private
export const getAllProgress = async (req, res) => {
  try {
    const progress = await Progress.find({ student: req.user.id })
      .populate('course', 'title thumbnail category')
      .sort({ lastAccessed: -1 });
    
    res.status(200).json({
      status: 'success',
      results: progress.length,
      data: { progress }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update video completion
// @route   POST /api/student/progress/:courseId/video/:videoId
// @access  Private
export const markVideoComplete = async (req, res) => {
  try {
    let progress = await Progress.findOne({
      student: req.user.id,
      course: req.params.courseId
    });
    
    if (!progress) {
      const course = await Course.findById(req.params.courseId);
      progress = await Progress.create({
        student: req.user.id,
        course: req.params.courseId,
        totalVideos: course.modules?.length || 0
      });
    }
    
    // Add video to completed if not already there
    if (!progress.completedVideos.includes(req.params.videoId)) {
      progress.completedVideos.push(req.params.videoId);
    }
    
    // Update completion percentage
    progress.completionPercentage = Math.round(
      (progress.completedVideos.length / progress.totalVideos) * 100
    );
    
    // Update time spent (from request body)
    if (req.body.timeSpent) {
      progress.timeSpent += req.body.timeSpent;
    }
    
    progress.lastAccessed = Date.now();
    await progress.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Progress updated successfully',
      data: { progress }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add quiz score
// @route   POST /api/student/progress/:courseId/quiz
// @access  Private
export const addQuizScore = async (req, res) => {
  try {
    const { quiz, score, totalQuestions } = req.body;
    
    const progress = await Progress.findOne({
      student: req.user.id,
      course: req.params.courseId
    });
    
    if (!progress) {
      return res.status(404).json({
        status: 'error',
        message: 'Progress record not found'
      });
    }
    
    progress.quizScores.push({
      quiz,
      score,
      totalQuestions,
      date: Date.now()
    });
    
    await progress.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Quiz score added successfully',
      data: { progress }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get analytics for admin
// @route   GET /api/admin/progress/analytics
// @access  Private/Admin
export const getProgressAnalytics = async (req, res) => {
  try {
    const totalStudents = await Progress.distinct('student').countDocuments();
    const avgCompletion = await Progress.aggregate([
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completionPercentage' }
        }
      }
    ]);
    
    const topPerformers = await Progress.find()
      .sort({ completionPercentage: -1 })
      .limit(10)
      .populate('student', 'name email')
      .populate('course', 'title');
    
    res.status(200).json({
      status: 'success',
      data: {
        totalStudents,
        avgCompletion: avgCompletion[0]?.avgCompletion || 0,
        topPerformers
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
