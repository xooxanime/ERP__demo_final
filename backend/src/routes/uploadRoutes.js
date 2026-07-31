import express from 'express';
import path from 'path';
import fs from 'fs';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Route to handle single file upload with Cloudinary + local storage fallback
router.post('/', protect, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const folder = req.query.folder || 'general';
    const fileExt = path.extname(req.file.originalname) || '.bin';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;

    // Try Cloudinary / Local Fallback
    const uploadsDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);
    const localUrl = `/uploads/${folder}/${fileName}`;

    res.status(200).json({
      status: 'success',
      data: {
        url: localUrl,
        publicId: `local_${fileName}`,
        fileName: req.file.originalname,
        fileType: req.file.originalname.split('.').pop().toUpperCase(),
        fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`
      }
    });
  } catch (err) {
    console.error('Upload endpoint error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
