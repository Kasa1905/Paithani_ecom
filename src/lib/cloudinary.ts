import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'node:stream';

const requiredEnv = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

let isConfigured = false;

const ensureConfigured = () => {
  if (isConfigured) return;
  if (!requiredEnv.cloudName || !requiredEnv.apiKey || !requiredEnv.apiSecret) {
    throw new Error('Cloudinary environment variables are missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  cloudinary.config({
    cloud_name: requiredEnv.cloudName,
    api_key: requiredEnv.apiKey,
    api_secret: requiredEnv.apiSecret,
    secure: true,
  });

  isConfigured = true;
};

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

export const uploadImageToCloudinary = async (file: File, folder = 'paithani'): Promise<CloudinaryUploadResult> => {
  ensureConfigured();

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || folder;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed.'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};
