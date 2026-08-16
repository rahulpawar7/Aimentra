import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadBufferToCloudinary } from '../config/cloudinary';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function isCloudinaryConfigured() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

async function saveFile(
  file: Express.Multer.File,
  folder: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
) {
  if (isCloudinaryConfigured()) {
    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: `aimentra/${folder}`,
      resource_type: resourceType,
    });
    return {
      url: result.secure_url as string,
      publicId: result.public_id as string,
      provider: 'cloudinary',
    };
  }

  ensureUploadDir();
  const subDir = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

  const ext = path.extname(file.originalname) || '.bin';
  const filename = `${uuidv4()}${ext}`;
  const filepath = path.join(subDir, filename);
  fs.writeFileSync(filepath, file.buffer);

  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return {
    url: `${baseUrl}/uploads/${folder}/${filename}`,
    publicId: filename,
    provider: 'local',
  };
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    const result = await saveFile(req.file, 'images', 'image');
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    const result = await saveFile(req.file, 'videos', 'video');
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    const result = await saveFile(req.file, 'documents', 'raw');
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
