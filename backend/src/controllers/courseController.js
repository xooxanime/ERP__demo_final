import Course from '../models/Course.js';
import Module from '../models/Module.js';

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getAllCourses = async (req, res) => {
  try {
    const { category, search, sort } = req.query;

    // Build query
    let query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query
    let courses = Course.find(query);

    // Sorting
    if (sort === 'price-low') {
      courses = courses.sort({ price: 1 });
    } else if (sort === 'price-high') {
      courses = courses.sort({ price: -1 });
    } else if (sort === 'popular') {
      courses = courses.sort({ enrolledStudents: -1 });
    } else if (sort === 'rating') {
      courses = courses.sort({ rating: -1 });
    } else {
      courses = courses.sort({ createdAt: -1 });
    }

    const result = await courses;

    res.status(200).json({
      status: 'success',
      results: result.length,
      data: { courses: result }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    // Get modules for this course
    const modules = await Module.find({ courseId: course._id, isPublished: true })
      .sort({ order: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        course,
        modules
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get course categories
// @route   GET /api/courses/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Course.distinct('category');

    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
