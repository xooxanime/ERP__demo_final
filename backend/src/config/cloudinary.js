import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (file, folder = 'uploads') => {
  const isConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes('placeholder')
  );

  if (isConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file, {
        folder: folder,
        resource_type: 'auto'
      });
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      console.warn('Cloudinary upload failed, falling back to local storage:', error.message);
    }
  }

  // Safe Local Storage Fallback
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let fileExt = 'bin';
    if (typeof file === 'string') {
      const mimeMatch = file.match(/^data:([^;]+);base64,/);
      if (mimeMatch) {
        const mime = mimeMatch[1].toLowerCase();
        if (mime.includes('png')) fileExt = 'png';
        else if (mime.includes('jpeg') || mime.includes('jpg')) fileExt = 'jpg';
        else if (mime.includes('gif')) fileExt = 'gif';
        else if (mime.includes('pdf')) fileExt = 'pdf';
        else if (mime.includes('word') || mime.includes('docx')) fileExt = 'docx';
        else if (mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('xlsx')) fileExt = 'xlsx';
        else if (mime.includes('zip')) fileExt = 'zip';
        else if (mime.includes('text/plain')) fileExt = 'txt';
        else if (mime.includes('json')) fileExt = 'json';
      }
    }
    
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    let buffer;
    if (typeof file === 'string' && file.startsWith('data:')) {
      const base64Data = file.replace(/^data:.*?;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(file)) {
      buffer = file;
    } else {
      buffer = Buffer.from(file);
    }

    fs.writeFileSync(filePath, buffer);
    const localUrl = `/uploads/${folder}/${fileName}`;
    return {
      url: localUrl,
      publicId: `local_${fileName}`
    };
  } catch (err) {
    console.error('Local fallback upload failed:', err);
    throw new Error(`Upload failed: ${err.message}`);
  }
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || publicId.startsWith('local_')) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

export default cloudinary;
