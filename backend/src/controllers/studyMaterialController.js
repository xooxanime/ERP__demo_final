import StudyMaterial from '../models/StudyMaterial.js';
import Batch from '../models/Batch.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

// @desc    Get all study materials
// @route   GET /api/study-materials
// @access  Public
export const getAllStudyMaterials = async (req, res) => {
  try {
    const { category, subject, course, batchId, teacherId, academicSessionId } = req.query;
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (subject) filter.subject = subject;
    if (course) filter.course = course;
    if (batchId) {
      filter.$or = [
        { batchId: batchId },
        { batchId: { $exists: false } },
        { batchId: null }
      ];
    }
    if (teacherId) filter.teacherId = teacherId;
    if (academicSessionId) filter.academicSessionId = academicSessionId;
    
    const materials = await StudyMaterial.find(filter)
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: materials.length,
      data: { materials }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single study material
// @route   GET /api/study-materials/:id
// @access  Public
export const getStudyMaterialById = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id).populate('course', 'title');
    
    if (!material) {
      return res.status(404).json({
        status: 'error',
        message: 'Study material not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { material }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Download study material
// @route   POST /api/study-materials/:id/download
// @access  Private
export const downloadStudyMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        status: 'error',
        message: 'Study material not found'
      });
    }
    
    // Increment download count
    material.downloads += 1;
    await material.save();
    
    res.status(200).json({
      status: 'success',
      data: { 
        fileUrl: material.fileUrl,
        fileName: material.title
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create study material (Admin/Teacher)
// @route   POST /api/study-materials
// @access  Private (Admin, Teacher)
export const createStudyMaterial = async (req, res) => {
  try {
    // If uploaded by teacher, link the teacher ID
    const materialData = {
      ...req.body,
      teacherId: req.user.role === 'teacher' ? req.user.id : req.body.teacherId
    };

    // Strict batch-to-teacher linkage authorization checks
    if (req.user.role === 'teacher') {
      if (!materialData.batchId) {
        return res.status(400).json({ status: 'error', message: 'batchId is required' });
      }
      const batch = await Batch.findById(materialData.batchId);
      if (!batch) {
        return res.status(404).json({ status: 'error', message: 'Batch not found' });
      }
      const isAssigned = batch.teachers.some(t => t.toString() === req.user.id) ||
                         (batch.batchManager && batch.batchManager.toString() === req.user.id);
      if (!isAssigned) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to upload study materials for a batch you are not assigned to'
        });
      }
    }

    const material = await StudyMaterial.create(materialData);
    
    res.status(201).json({
      status: 'success',
      message: 'Study material created successfully',
      data: { material }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update study material (Admin/Teacher)
// @route   PUT /api/study-materials/:id
// @access  Private (Admin, Teacher)
export const updateStudyMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        status: 'error',
        message: 'Study material not found'
      });
    }

    // Ownership check for teachers
    if (req.user.role === 'teacher' && material.teacherId?.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to modify study materials uploaded by another educator'
      });
    }

    // Clean up old Cloudinary asset if a new one is uploaded
    if (req.body.publicId && material.publicId && req.body.publicId !== material.publicId) {
      await deleteFromCloudinary(material.publicId);
    }

    Object.assign(material, req.body);
    await material.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Study material updated successfully',
      data: { material }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete study material (Admin/Teacher)
// @route   DELETE /api/study-materials/:id
// @access  Private (Admin, Teacher)
export const deleteStudyMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        status: 'error',
        message: 'Study material not found'
      });
    }

    // Ownership check for teachers
    if (req.user.role === 'teacher' && material.teacherId?.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete study materials uploaded by another educator'
      });
    }

    // Delete Cloudinary asset if present
    if (material.publicId) {
      await deleteFromCloudinary(material.publicId);
    }

    await material.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'Study material deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
