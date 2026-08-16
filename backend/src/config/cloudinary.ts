import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const memory = multer.memoryStorage();

function mimeFilter(allowedPrefixes: string[], allowedExact: string[] = []) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (
      allowedPrefixes.some((p) => file.mimetype.startsWith(p)) ||
      allowedExact.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  };
}

/** Upload a buffer already held by multer to Cloudinary */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    public_id?: string;
  }
) {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resource_type || 'auto',
        public_id: options.public_id,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export const uploadVideo = multer({
  storage: memory,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: mimeFilter(['video/']),
});

export const uploadImage = multer({
  storage: memory,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: mimeFilter(['image/']),
});

export const uploadDocument = multer({
  storage: memory,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: mimeFilter([], [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
  ]),
});

export const uploadAvatar = multer({
  storage: memory,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: mimeFilter(['image/']),
});

export { cloudinary };
