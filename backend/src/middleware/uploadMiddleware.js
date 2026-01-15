import multer from 'multer';
import path from 'path';
import { FILE_LIMITS } from '../config/constants.js';
import { AppError } from './errorMiddleware.js';
import { HTTP_STATUS } from '../config/constants.js';
import crypto from 'crypto';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on content type
    const contentType = req.body.contentType || 'general';
    const dir = path.join(uploadDir, contentType);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  // Check file type based on content type
  const contentType = req.body.contentType;

  if (contentType === 'speaking') {
    if (FILE_LIMITS.ALLOWED_AUDIO_FORMATS.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Invalid audio format. Allowed formats: ${FILE_LIMITS.ALLOWED_AUDIO_FORMATS.join(', ')}`,
          HTTP_STATUS.BAD_REQUEST
        ),
        false
      );
    }
  } else if (contentType === 'writing') {
    // Writing submissions don't need file upload (text only)
    cb(null, false);
  } else {
    // For quiz or other types
    cb(null, true);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_LIMITS.MAX_SIZE,
  },
  fileFilter: fileFilter,
});

/**
 * Middleware for single audio file upload
 */
export const uploadAudio = upload.single('audio');

/**
 * Middleware for multiple file uploads
 */
export const uploadMultiple = upload.array('files', 5);

/**
 * Error handling for multer
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `File too large. Maximum size is ${FILE_LIMITS.MAX_SIZE / 1024 / 1024}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Too many files uploaded',
      });
    }
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  next(err);
};

export default {
  uploadAudio,
  uploadMultiple,
  handleUploadError,
};
