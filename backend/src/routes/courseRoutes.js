import express from 'express';
import {
  getAllCourses,
  getCourse,
  getCategories
} from '../controllers/courseController.js';

const router = express.Router();

router.get('/', getAllCourses);
router.get('/categories', getCategories);
router.get('/:id', getCourse);

export default router;
