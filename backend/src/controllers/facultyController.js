import User from '../models/User.js';
import Permission from '../models/Permission.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Get all faculty members
// @route   GET /api/faculty
// @access  Public
export const getAllFaculty = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).sort({ createdAt: -1 });
    
    const facultyList = teachers.map(teacher => {
      const specialization = teacher.teacherInfo?.specialization || '';
      return {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        designation: teacher.teacherInfo?.department || 'Faculty',
        qualification: teacher.teacherInfo?.qualifications || 'N/A',
        experience: teacher.teacherInfo?.experience || 'N/A',
        specialization: specialization || 'N/A',
        bio: teacher.teacherInfo?.qualifications 
          ? `${teacher.name} is an expert in ${specialization || 'their field'} with qualifications: ${teacher.teacherInfo.qualifications}.`
          : 'Faculty member',
        subjects: specialization 
          ? specialization.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        achievements: [],
        image: {
          url: teacher.avatar || 'https://res.cloudinary.com/demo/image/upload/avatar-placeholder.png'
        },
        isActive: teacher.isActive
      };
    });

    res.status(200).json({
      status: 'success',
      results: facultyList.length,
      data: { faculty: facultyList }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single faculty member
// @route   GET /api/faculty/:id
// @access  Public
export const getFacultyById = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    
    if (!teacher) {
      return res.status(404).json({
        status: 'error',
        message: 'Faculty member not found'
      });
    }

    const specialization = teacher.teacherInfo?.specialization || '';
    const faculty = {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      designation: teacher.teacherInfo?.department || 'Faculty',
      qualification: teacher.teacherInfo?.qualifications || 'N/A',
      experience: teacher.teacherInfo?.experience || 'N/A',
      specialization: specialization || 'N/A',
      bio: teacher.teacherInfo?.qualifications 
        ? `${teacher.name} is an expert in ${specialization || 'their field'} with qualifications: ${teacher.teacherInfo.qualifications}.`
        : 'Faculty member',
      subjects: specialization 
        ? specialization.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      achievements: [],
      image: {
        url: teacher.avatar || 'https://res.cloudinary.com/demo/image/upload/avatar-placeholder.png'
      },
      isActive: teacher.isActive
    };
    
    res.status(200).json({
      status: 'success',
      data: { faculty }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create faculty member (Admin only)
// @route   POST /api/admin/faculty
// @access  Private/Admin
export const createFaculty = async (req, res) => {
  try {
    const { name, email, designation, qualification, experience, specialization, subjects, imageBase64 } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        status: 'error',
        message: 'A user with this email already exists'
      });
    }

    // Assign teacher permissions
    const permission = await Permission.findOne({ role: 'teacher' });
    const permissionId = permission ? permission._id : undefined;

    let avatarUrl = 'https://res.cloudinary.com/demo/image/upload/avatar-placeholder.png';
    if (imageBase64) {
      const uploadResult = await uploadToCloudinary(imageBase64, 'faculty');
      avatarUrl = uploadResult.url;
    }

    // Determine specialization string from subjects array or specialization input
    const specStr = (subjects && subjects.length > 0) 
      ? subjects.join(', ') 
      : (specialization || '');

    // Create user
    user = await User.create({
      name,
      email,
      phone: '9999999999', // default placeholder phone number
      password: 'Test@123', // default testing password
      role: 'teacher',
      avatar: avatarUrl,
      approvalStatus: 'approved',
      permissions: permissionId,
      teacherInfo: {
        qualifications: qualification,
        experience: experience,
        specialization: specStr,
        department: designation
      }
    });

    const faculty = {
      _id: user._id,
      name: user.name,
      email: user.email,
      designation: user.teacherInfo.department,
      qualification: user.teacherInfo.qualifications,
      experience: user.teacherInfo.experience,
      specialization: user.teacherInfo.specialization,
      bio: `Expert in ${user.teacherInfo.specialization}`,
      subjects: user.teacherInfo.specialization.split(',').map(s => s.trim()).filter(Boolean),
      achievements: [],
      image: { url: user.avatar },
      isActive: user.isActive
    };
    
    res.status(201).json({
      status: 'success',
      message: 'Faculty member created successfully',
      data: { faculty }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update faculty member (Admin only)
// @route   PUT /api/admin/faculty/:id
// @access  Private/Admin
export const updateFaculty = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'teacher' });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Faculty member not found'
      });
    }

    const { name, email, designation, qualification, experience, specialization, subjects, imageBase64 } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;

    if (!user.teacherInfo) {
      user.teacherInfo = {};
    }

    const specStr = (subjects && subjects.length > 0) 
      ? subjects.join(', ') 
      : (specialization || user.teacherInfo.specialization || '');

    user.teacherInfo.qualifications = qualification || user.teacherInfo.qualifications;
    user.teacherInfo.experience = experience || user.teacherInfo.experience;
    user.teacherInfo.specialization = specStr;
    user.teacherInfo.department = designation || user.teacherInfo.department;

    if (imageBase64) {
      const uploadResult = await uploadToCloudinary(imageBase64, 'faculty');
      user.avatar = uploadResult.url;
    }
    
    await user.save();

    const faculty = {
      _id: user._id,
      name: user.name,
      email: user.email,
      designation: user.teacherInfo.department,
      qualification: user.teacherInfo.qualifications,
      experience: user.teacherInfo.experience,
      specialization: user.teacherInfo.specialization,
      bio: `Expert in ${user.teacherInfo.specialization}`,
      subjects: user.teacherInfo.specialization.split(',').map(s => s.trim()).filter(Boolean),
      achievements: [],
      image: { url: user.avatar },
      isActive: user.isActive
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Faculty member updated successfully',
      data: { faculty }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete faculty member (Admin only)
// @route   DELETE /api/admin/faculty/:id
// @access  Private/Admin
export const deleteFaculty = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'teacher' });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Faculty member not found'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'Faculty member deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
